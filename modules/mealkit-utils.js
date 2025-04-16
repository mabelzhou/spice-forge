let mealkits = [
    {
        id: 1,
        name: "Greek-Style Creamy Stuffed Eggplant",
        includes: "Salad, yogurt & fresh herbs",
        description: "Hearty eggplant stuffed with feta and fresh herbs, served with Greek salad.",
        category: "Vegetarian Meals",
        price: 10.99,
        cookingTime: 30,
        servings: 2,
        imageUrl: "/images/eggplant.jpg", //https://unsplash.com/photos/sliced-tomatoes-with-ground-pork-iNwCO9ycBlc
        featuredMealkit: false,
        altText: "Greek-Style Creamy Stuffed Eggplant"
    },
    {
        id: 2,
        name: "Vietnamese-Inspired Chicken Pho",
        includes: "Broccoli, bell peppers, carrots, cilantro and lime",
        description: "Aromatic grilled chicken served with rice noodles in bone broth.",
        category: "Healthy Eating",
        price: 12.99,
        cookingTime: 20,
        servings: 3,
        imageUrl: "/images/noodles.jpg", //https://unsplash.com/photos/brown-chopsticks-on-white-bowl-L1ZhjK-R6uc
        featuredMealkit: true,
        altText: "Vietnamese-Inspired Chicken Pho"
    },
    {
        id: 3,
        name: "Creamy Aioli Chicken Wings",
        includes: "Glazed yams, broccoli, squash and cranberries",
        description: "Braised chicken wings in a garlic aioli sauce, served with roasted vegetables.",
        category: "Comfort Foods",
        price: 12.99,
        cookingTime: 40,
        servings: 4,
        imageUrl: "/images/wings.jpg", //https://unsplash.com/photos/cooked-food-on-plate-ZjEeMnDiq00
        featuredMealkit: true,
        altText: "Creamy Aioli Chicken Wings"
    },
    {
        id: 4,
        name: "Zesty Almond Salmon and Quinoa",
        includes: "Carrots, green beans, celery, onions and fresh herbs",
        description: "Zesty almond-crusted salmon served with quinoa and steamed vegetables.",
        category: "Healthy Eating",
        price: 14.99,
        cookingTime: 30,
        servings: 2,
        imageUrl: "/images/salmon.jpg", //https://unsplash.com/photos/broccoli-with-meat-on-plate-mmnKI8kMxpc
        featuredMealkit: true,
        altText: "Zesty Almond Salmon and Quinoa"
    },
    {
        id: 5,
        name: "Creamy Pan Fried Tilapia in Mushroom Sauce",
        includes: "Kale and mustard greens",
        description: "Pan-fried tilapia in a creamy mushroom sauce, served collared greens.",
        category: "Comfort Foods",
        price: 14.99,
        cookingTime: 25,
        servings: 2,
        imageUrl: "/images/tilapia.jpg", //https://unsplash.com/photos/bowl-of-stew-salmon-8pUjhBm4cLw
        featuredMealkit: false,
        altText: "Creamy Pan Fried Tilapia in Mushroom Sauce"
    },
    {
        id: 6,
        name: "Spicy Shakshuka with Feta and Olives",
        includes: "Pita bread, hummus and fresh herbs",
        description: "Spicy tomato and pepper stew with poached eggs, served with pita bread.",
        category: "Vegetarian Meals",
        price: 11.99,
        cookingTime: 25,
        servings: 2,
        imageUrl: "/images/shakshuka.jpg", //https://unsplash.com/photos/steam-pasta-beside-tomatoes-and-plate-NjmhU8Om3C4
        featuredMealkit: true,
        altText: "Spicy Shakshuka with Feta and Olives"
    },
    {
        id: 7,
        name: "Spicy Sausage and Cheese Cappeletti",
        includes: "Garlic bread, salad and fresh herbs",
        description: "Spicy sausage and cheese cappeletti served with garlic bread and a fresh salad.",
        category: "Comfort Foods",
        price: 13.99,
        cookingTime: 25,
        servings: 2,
        imageUrl: "/images/cappelletti.jpg", //https://unsplash.com/photos/sliced-fruit-on-white-ceramic-plate-kZYHddxKv9E
        featuredMealkit: false,
        altText: "Spicy Sausage and Cheese Cappeletti"
    }
];

// return all mealkits
module.exports.getAllMealkits = () => {
    return mealkits;
};

// return all mealkits that are featured
module.exports.getFeaturedMealkits = () => {
    let filtered = [];

    for (let i = 0; i < mealkits.length; i++) {
        if (mealkits[i].featuredMealkit) {
            filtered.push(mealkits[i]);
        }
    }

    return filtered;
};

// return a single array of mealkits grouped by category
module.exports.getMealKitsByCategory = (mealkits) => {
    let result = {};

    // loop through mealkits and group by category
    for (let i = 0; i < mealkits.length; i++) {
        if (result[mealkits[i].category]) {
            result[mealkits[i].category].push(mealkits[i]);
        } else {
            result[mealkits[i].category] = [mealkits[i]];
        }
    }

    // format into array and return
    return Object.keys(result).map(category => ({
        categoryName: category,
        mealKits: result[category]
    }));
};