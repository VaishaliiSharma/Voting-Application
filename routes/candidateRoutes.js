const express = require('express');
const router = express.Router();
const User = require('./../models/user');
const {jwtAuthMiddleware, generateToken} = require('./../jwt');
const Candidate = require('./../models/candidate');

const checkAdminRole = async (userID) => {
    try{
        const user = await User.findById(userID);
        console.log("user: ",user);
        if(user.role === 'admin'){
            return true;
        }
    }catch(err){
        return false;
    }
};


// to add a candidate
router.post('/', jwtAuthMiddleware, async (req, res) =>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user has not admin role'});
        
        const data = req.body // Assuming the request body contains the person data

        // Create a new Person document using the Mongoose model
        const newCandidate = new Candidate(data);

        // Save the new person to the database
        const response = await newCandidate.save();
        console.log('data saved');
        res.status(200).json({response: response});
    }
    catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// to update a candidate's details
router.put('/:candidateID', jwtAuthMiddleware, async (req, res)=>{
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user has not admin role'});

        const candidateID = req.params.candidateID; // Extract the id from the URL parameter
        const updatedCandidateData = req.body; // Updated data for the person

        const response = await Candidate.findByIdAndUpdate(candidateID, updatedCandidateData, {
            new: true, // Return the updated document
            runValidators: true, // Run Mongoose validation
        })

        if (!response) {
            return res.status(404).json({ error: 'candidate not found' });
        }

        console.log('candidate data updated');
        res.status(200).json(response);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


// to delete a candidate's details
router.delete('/:candidateID', jwtAuthMiddleware, async (req, res) => {
    try{
        if(!(await checkAdminRole(req.user.id)))
            return res.status(403).json({message: 'user has not admin role'});

        const candidateID = req.params.candidateID; // Extract the person's ID from the URL parameter
        
        // Assuming you have a Person model
        const response = await Candidate.findByIdAndDelete(candidateID);

        if (!response) {
            return res.status(404).json({ error: 'Person not found' });
        }

        console.log('candidate data delete');
        res.status(200).json({message: 'person Deleted Successfully'});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});

// for a user to vote a candidate
router.post('/vote/:candidateID', jwtAuthMiddleware, async (req,res) => {
    candidateID=req.params.candidateID;
    userId=req.user.id;

    try{
        //find the candidate document with the specified candidateID
        const candidate = await Candidate.findById(candidateID);
        if(!candidate){
            return res.status(404).json({message: 'Candidate not found'});
        }

        const user=await User.findById(userId);
        if(!user){
            return res.status(404).json({message: 'user not found'});
        }

        if(user.isVoted){
            return res.status(404).json({message: 'User has already voted'});
        }

        if(user.role == 'admin'){
            return res.status(404).json({message: 'Admin is not allowed to vote'});

        }

        //update the candidate document to record the vote
        candidate.votes.push({user: userId})
        candidate.voteCount++;
        await candidate.save();

        //update the user document
        user.isVoted = true
        await user.save();

        res.status(200).json({message: 'Vote recorded Successfully'});

    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


// to count number of votes
router.get('/vote/count', async (req,res) => {
    try{
        //find all candidates and sort them by voteCount in descending order
        const candidate = await Candidate.find().sort({voteCount: 'desc'});

        //map the candidates to only return their name and voteCount
        const voteRecord = candidate.map((data) => {
            return {
                party: data.party,
                count: data.voteCount
            }
        });

        return res.status(200).json(voteRecord);
    }catch(err){
        console.log(err);
        res.status(500).json({error: 'Internal Server Error'});
    }
});


// to get List of all candidates with only name and party fields
router.get('/', async (req, res) => {
    try {
        // Find all candidates and select only the name and party fields, excluding _id
        const candidates = await Candidate.find({}, 'name party -_id');

        // Return the list of candidates
        res.status(200).json(candidates);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});

module.exports = router;
