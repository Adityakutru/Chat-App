import cloudinary from '../lib/cloudinary.js';
import generateToken from '../lib/utils.js';
import User from '../models/user.models.js'
import bcrypt from 'bcrypt'

export const signup = async (req, res)=>{
    const {fullName, email, password} = req.body; 
    
    try {
        //If any field is not filled:
        if(!fullName || !email || !password){
            return res.status(400).json({message:"All fields are required"})
        }
        //If the password length is less than 6
        if(password.length<6){
            return res.status(400).json({message:"Your password must be 6 characters or more."})
        }

        //Checks if the user already exists
        const user = await User.findOne({email})
        if(user) return res.status(400).json({message:"Email already exists."})

        //Generate the salt for bcrypt hashing
        const salt = await bcrypt.genSalt(10)
    
        const hashedPassword =await bcrypt.hash(password, salt)

        //create the new user in the database
        const newUser = new User({
            fullName,
            email,
            password:hashedPassword
        })

        //If user created successfully
        if(newUser){
            //we will generate the jwt token here
            generateToken(newUser._id,res)
            await newUser.save()
            res.status(201).json({
                _id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                profilePic: newUser.profilePic,
                message:"Created successfully"})
        }
        //If there was any problem in creating user
        else
            {
            res.status(400).json({message:"Invalid User Data"})
        }
    }
    //any problem
    catch (error) 
    {
        console.log("Error in signup controller", error.message)
        res.status(500).json({message:"Internal Server Error"})
    }  
}


export const login = async (req, res)=>{
    try {
        const {email, password} = req.body

        if(!email||!password){
            return res.status(400).json({message:"All fields are required"})
        }
        const user = await User.findOne({email})
        if(!user){
            return res.status(400).json({message:"Invalid credentials"});
        }
        const isValid = bcrypt.compare(password, user.password)
        if(!isValid){
            return res.status(400).json({message:"Invalid credentials"});
        }
        generateToken(user._id, res)

        res.status(200).json({
            _id:user.id,
            fullName: user.fullName,
            email: user.email,
            profilePic: user.profilePic
        })

    } catch (error) {
        console.log("Error in login controller", error.message)
        res.status(500).json({message:"Internal Server Error"})
    }
}


export const logout = async (req, res)=>{
    try {
        res.cookie("jwt", "",{maxAge:0})
        res.status(200).json({message:"Logged out successfully"})
    } catch (error) {
        console.log("Error in logout controller", error.message)
        res.status(500).json({message:"Internal Server Error"})
    }
}


export const updateProfile = async(req, res)=>{
    try {
        const {profilePic} = req.body;
        const userId = req.user._id;

        if(!profilePic){
            return res.status(400).json({message:"Profile pic is required"})
        }

        const uploadResponse = await cloudinary.uploader.upload(profilePic)
        const updatedUser = await User.findByIdAndUpdate(userId, {profilePic:uploadResponse.secure_url},{new:true})

        res.status(200).json(updatedUser)

    } catch (error) {
        console.log("Error updating profilePic: ",error.message)
        return res.status(500).json({message:"Internal server error"})
    }
}


export const checkAuth = async(req, res)=>{
    try {
        res.status(200).json(req.user)
    } catch (error) {
        console.log("Error in checkAuth controller: ", error.message)
        res.status(500).json({message: "Internal server error"})
    }
}