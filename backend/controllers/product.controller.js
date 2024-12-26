import cloudinary from "../lib/cloudinary.js";
import { redis } from "../lib/redis.js";
import Product from "../models/product.model.js";

export const getAllProducts = async (req, res) => {
  try {
    const products = await Product.find({});

    res.json({ products });
  } catch (error) {
    console.log("Error in getAllProducts", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

/**
 * @description Get all the featured products from the database.
 *              If the featured products are already stored in redis, 
 *              then return them from redis otherwise fetch from the database, 
 *              store them in redis, and then return them.
 * @route GET /api/products/featured
 * @returns {object} The featured products.
 */

export const getFeaturedProducts = async (req, res) => {
  try {
    let featuredProducts = await redis.get("featuredProducts");

    if (featuredProducts) {
       return res.json({ featuredProducts });
    }
    // .lean() is gonna return a plain javascript object instead of a mongodb document
        // which is good for performance I

    featuredProducts = await Product.find({ isFeatured: true }).lean();

    if (!featuredProducts) {
      return res.status(404).json({ message: "No featured products found" });
    }

    //Store in redis to get faster
    await redis.set("featuredProducts", JSON.stringify(featuredProducts));

    res.json({ featuredProducts });
  } catch (error) {
    console.log("Error in getFeaturedProducts", error.message);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const createProduct= async(req,res)=>{
    try {
        const {name,description,price,image,category}=req.body;
        let  cloudinaryResponse = null;

        cloudinaryResponse=await cloudinary.uploader.upload(image,{ folder:"products",});

        const product=await Product.create({
            name,
            description,
            price,
            image:cloudinaryResponse?.secure_url?cloudinaryResponse.secure_url:" ",
            category,
        });

        res.status(201).json({product});

    } catch (error) {
        console.log("Error in createProduct", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const deleteProduct=async(req,res)=>{
    try {
        const {id}=req.params;

        const product=await Product.findById(id);
        
        if(!product){
            return res.status(404).json({message:"Product not found"});
        }
        
        //http://res.cloudinary.com/demo/image/upload/v1681278202/sample.jpg
        //.split ---------------["http:", "", "res.cloudinary.com", "demo", "image", "upload", "v1681278202", "sample.jpg"]
        //.pop---------------- "sample.jpg"
        //.split(".")-------- ["sample", "jpg"]
        //.[0]---------------- "sample"
        
        if(product.image){
            const imageId=product.image.split("/").pop().split(".")[0];
            try {
                const des = await cloudinary.uploader.destroy(`products/${imageId}`);
                if(des) return console.log('Image deleted from cloudinary');
            } catch (error) {
                console.log('Error deleting image from cloudinary', error.message);
                return res.status(500).json({ message: "Error deleting image from cloudinary" });
            }
        }

        await Product.findByIdAndDelete(id);


        res.json({message:"Product deleted successfully"});

    } catch (error) {
        console.log("Error in deleteProduct", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getRecommendedProducts=async(req,res)=>{
    try {
        const products = await Product.aggregate([
            {
                $sample: { size: 3 },
            },
            {
                $project:{
                    name:1,
                    image:1,
                    price:1,
                    _id:1,
                    description:1
                }
            }
        ]);
        res.json({products});
    } catch (error) {
        console.log("Error in getRecommendedProducts", error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

export const getProductsByCategory=async(req,res)=>{
    try {
        const category=req.params;

        const products=await Product.find({category}); 
        
        if  (!products){
            return res.status(404).json({message:"No products found"});
        }
        
        res.json({products});
    } catch (error) {
        console.log('Error in getProductsByCategory', error.message);
        res.status(500).json({ message: "Server error", error: error.message }); 
    }
}

export const toggleFeatured=async(req,res)=>{
    try {
        const {id}=req.params;
        const product=await Product.findById(id);

       if(product){
        product.isFeatured=!product.isFeatured;
        const updatedProduct=await product.save();
        await updateFeaturedProductCache();
        return res.json({updatedProduct});
       }
       else{
        return res.status(404).json({message:"Product not found"});
       }

    } catch (error) {
        console.log('Error in toggleFeatured', error.message);
        res.status(500).json({ message: "Server error", error: error.message });
    }
}

async function updateFeaturedProductCache(){
    try {
        const featuredProducts=await Product.find({isFeatured:true}).lean();
        await redis.set("featuredProducts",JSON.stringify(featuredProducts));
    } catch (error) {
        console.log('Error updating featured product cache', error.message);
    }
}