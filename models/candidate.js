const mongoose = require('mongoose');

//defining the candidate schema
const candidateSchema = new mongoose.Schema({
    name:{
        type:String,
        required:true
    },
    age:{
        type:Number,
        required:true
    },
    role:{
        type:String,
        enum: ['voter','admin'],
        default: 'voter'
    },
    party:{
        type:String,
        required:true
    },
    votes: [
        {   // a nested object
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User',
                required: true
            },
            votedAt: {
                type:Date,
                default: Date.now()
            }
        }
    ],
    voteCount: {
        type:Number,
        default:0
    }

});

// create candidate model
const Candidate = mongoose.model('Candidate',candidateSchema);
module.exports = Candidate;