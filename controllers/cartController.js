const express = require("express");
const router = express.Router();
const mealkitModel = require("../models/mealkitModel");

// set up mailgun
const formData = require('form-data');
const Mailgun = require('mailgun.js');
const mailgun = new Mailgun(formData);
const mg = mailgun.client({username: 'api', key: process.env.MAILGUN_API_KEY});

// route to cart page (GET /cart)
router.get("/", (req, res) => {
    // check role
    if (req.session.role !== "customer") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page." 
        });
    }

    res.render("cart/cart", { 
        title: "Cart",
        cart: req.session.cart || [],
        subtotal: req.session.subtotal || 0,
        tax: req.session.tax || 0,
        total: req.session.total || 0
    });
});

// update totals
function updateCartTotals(req) {
    let cart = req.session.cart || {};
    let subtotal = 0;

    for (let id in cart) {
        subtotal += cart[id].price * cart[id].quantity;
    }

    req.session.subtotal = subtotal;
    req.session.tax = subtotal * 0.1;
    req.session.total = subtotal + req.session.tax;
}

// route to add item to cart (GET /cart/add/:id)
router.get("/add/:id", (req, res) => {
    // check role
    if (req.session.role !== "customer") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page." 
        });
    }

    // get meal kit ID
    const id = req.params.id;

    // Make sure the shopping cart exists and if not
    // add a new empty array to the session.
    let cart = req.session.cart = req.session.cart || {};

    // find meal kit in database
    mealkitModel.findById(id)
        .then(data => {
            let meal = data.toObject();

            // check if meal is already in cart
            if (cart[id]) {
                // increment quantity
                cart[id].quantity++;
                console.log(`Incremented ${meal.name} in cart`);
            } else {
                // add meal to cart
                cart[id] = meal;
                cart[id].quantity = 1;
                console.log(`Added ${meal.name} to cart`);
            }

            // update totals
            updateCartTotals(req);

            // redirect to cart
            res.redirect("/cart");
        })
        .catch(err => {
            console.log("Error getting meal kit: " + err);
            res.render("general/error", { 
                title: "Error",
                message: "Error getting meal kit." 
            });
        });
});

// route to remove item from cart (POST /cart/remove/:id)
router.post("/remove/:id", (req, res) => {
    // check role
    if (req.session.role !== "customer") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page." 
        });
    }

    // get meal kit ID
    const id = req.params.id;

    // get cart
    let cart = req.session.cart || {};

    // get name
    let name = cart[id].name;

    // check if meal is in cart
    if (cart[id]) {
        delete cart[id];
        console.log(`Removed meal kit ${name} from cart`);
    }

    // update totals
    updateCartTotals(req);

    // redirect to cart
    res.redirect("/cart");
});

// route to add quantity to item in cart (POST /cart/increase/:id)
router.post("/increase/:id", (req, res) => {
    // check role
    if (req.session.role !== "customer") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page." 
        });
    }

    // get meal kit ID
    const id = req.params.id;

    // get cart
    let cart = req.session.cart || {};

    // check if meal is in cart
    if (cart[id]) {
        cart[id].quantity++;
        console.log(`Added 1 to ${cart[id].name} in cart`);
    }

    // update totals
    updateCartTotals(req);

    // update cart
    req.session.cart = cart;

    // redirect to cart
    res.redirect("/cart");
});

// route to subtract quantity from item in cart (POST /cart/decrease/:id)
router.post("/decrease/:id", (req, res) => {
    // check role
    if (req.session.role !== "customer") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page." 
        });
    }

    // get meal kit ID
    const id = req.params.id;

    // get cart
    let cart = req.session.cart || {};

    // check if meal is in cart
    if (cart[id]) {
        if (cart[id].quantity > 0) {
            cart[id].quantity--;
            console.log(`Subtracted 1 from ${cart[id].name} in cart`);
        }
    }

    // update totals
    updateCartTotals(req);

    // update cart
    req.session.cart = cart;

    // redirect to cart
    res.redirect("/cart");
});

// route to checkout page (POST /cart/checkout)
router.post("/checkout", (req, res) => {
    // check role
    if (req.session.role !== "customer") {
        res.status(401);
        return res.render("general/error", { 
            title: "Error",
            message: "You are not authorized to view this page." 
        });
    }

    // check if cart is empty
    if (Object.keys(req.session.cart).length === 0) {
        return res.render("general/error", { 
            title: "Error",
            message: "Your cart is empty." 
        });
    }

    // cart details
    let cartDetails = "";
    for (let id in req.session.cart) {
        const meal = req.session.cart[id];
        cartDetails += `<tr>
        <td style="padding-right: 10px;">${meal.name}</td>
        <td style="padding-right: 10px;">${meal.includes}</td>
        <td style="padding-right: 10px;">${meal.quantity}</td>
        <td style="padding-right: 10px;">$${(meal.price * meal.quantity).toFixed(2)}</td>
    </tr>`;
    }

    // send email of order
    mg.messages.create(process.env.MAILGUN_DOMAIN, {
        from: `Spice Forge Team <mailgun@${process.env.MAILGUN_DOMAIN}>`,
        to: [`${req.session.user.email}`],
        subject: "Spice Forge - Order Confirmation",
        text: "",
        html: `<h1>Thank you for your order!</h1>
        <p>Your order has been successfully placed. Here are the details:</p>
        <table>
            <thead>
                <tr>
                    <th>Item</th>
                    <th>Includes</th>
                    <th>Quantity</th>
                    <th>Total</th>
                </tr>
            </thead>
            <tbody>
                ${cartDetails}
            </tbody>
        </table>
        <br />
        <p>Subtotal: $${parseFloat(req.session.subtotal).toFixed(2)}</p>
        <p>Tax: $${parseFloat(req.session.tax).toFixed(2)}</p>
        <p><Strong>Total: $${parseFloat(req.session.total).toFixed(2)}</strong></p>
        `
       })
       .then(msg => {
        console.log(msg); 

        // clear cart
        req.session.cart = {};
        req.session.subtotal = 0;
        req.session.tax = 0;
        req.session.total = 0;

        // redirect to home page
        res.redirect("/");
       })
       .catch(err => {
        console.log(err); 
        res.status(500).send('An error occurred while sending the email.'); 
       });
});

module.exports = router;