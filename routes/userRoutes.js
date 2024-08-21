const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');

// to add a person/voter
router.post('/signup', async (req, res) => {
    try {
        const data = req.body; // Assuming the request body contains the user data

        // Check if the aadharCardNumber already exists
        const existingUser = await User.findOne({ aadharCardNumber: data.aadharCardNumber });
        if (existingUser) {
            return res.status(400).json({ error: 'Aadhar Card Number already exists' });
        }

        // Create a new User document using the Mongoose model
        const newUser = new User(data);

        // Save the new user to the database
        const response = await newUser.save();
        console.log('Data saved successfully:', response);

        const payload = { id: response.id };
        const token = generateToken(payload);

        res.status(200).json({ response: response, token: token });
    } catch (err) {
        console.error('Signup error:', err);
        if (err.code === 11000) { // MongoDB duplicate key error code
            res.status(400).json({ error: 'Aadhar Card Number already exists' });
        } else {
            res.status(500).json({ error: 'Internal Server Error' });
        }
    }
});


// to login
router.post('/login', async(req, res) => {
    try{
        // Extract username=aadharCardNumber and password from request body
        const {aadharCardNumber, password} = req.body;

        // Find the user by aadharCardNumber
        const user = await User.findOne({aadharCardNumber: aadharCardNumber});

        // If user does not exist or password does not match, return error
        if( !user || !(await user.comparePassword(password))){
            return res.status(401).json({error: 'Invalid username or password'});
        }

        // generate Token 
        const payload = {
            id: user.id
        }
        const token = generateToken(payload);

        // resturn token as response
        res.json({token})
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// to get a user's profile
router.get('/profile', jwtAuthMiddleware, async (req, res) => {
    try{
        const userData = req.user;
        const userId = userData.id;
        const user = await User.findById(userId);

        res.status(200).json({user});
    }catch(err){
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

// to update a user's profile
router.put('/profile/password', jwtAuthMiddleware, async (req, res)=>{
    try{
        const userId = req.user.id; // Extract the id from the token
        const {currentPassword, newPassword} = req.body    //extract current and new passwords from request body
        
        // Find the user by userID
        const user = await User.findById(userId);
        //if password does not match,return error
        if(!(await user.comparePassword(currentPassword))){
            return res.status(401).json({error:'invalid username or password'});
        }

        //update the user's password
        user.password=newPassword;
        await user.save();

        console.log('password updated');
        res.status(200).json({message:'password updated'});
    }catch(err){
            console.log(err)
            return res.status(500).json({error:'internal server error'});
        }
});


// to get the list of all voters
router.get('/', async (req, res) => {
    try {
        const users = await User.find({});

        // Return the list of voters
        res.status(200).json(users);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


module.exports = router;