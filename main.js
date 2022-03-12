const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const port = 80;

// Configure Express
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// Create jobs path router
var router = express.Router();

// API State
var job_counter = 0;
var jobs = {};
var job_queue = [];

const job_types = ["TIME_CRITICAL", "NOT_TIME_CRITICAL"];
const job_statuses = ["QUEUED", "IN_PROGRESS", "CONCLUDED"];


// Auxiliary Functions

function nextJobID() {
    return ++job_counter;
}

function isValidJob(job) {
    if(job?.Type) {
        if(typeof job.Type === 'string' || job.Type instanceof String) {
            if(job_types.includes(job.Type)) {
                // Type is valid
                return true;
            }
        }
    }
    return false;
}

// API Endpoints
router.post('/enqueue', (req, res) => {
    if(isValidJob(req.body)) {
        // Add new job to queue
        var job_id = nextJobID();
        var job = { "ID": job_id, "Status": "QUEUED", ...req.body };

        jobs[job_id] = job;
        job_queue.unshift(job);

        console.log(job);

        res.send(job_id.toString() + "\n");
    } else {
        res.status(400).send('Invalid Job\n');
    }
});

// Add the jobs router to the express app
app.use("/jobs", router);

// Start API Server
app.listen(port, () => {
    console.log(`Listening on port ${port} ...`);
})
