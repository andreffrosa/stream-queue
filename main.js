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
        var job = { ID: job_id, Status: "QUEUED", ts: Date.now(), ...req.body };

        jobs[job_id] = job;
        job_queue.unshift(job);

        console.log(job);

        res.send(job_id.toString() + "\n");
    } else {
        res.status(400).send('Invalid Job\n');
    }
});

router.get('/dequeue', (req, res) => {
    var job = job_queue.pop();
    if(job) {
        job.Status = "IN_PROGRESS";

        res.send(JSON.stringify(job) + "\n");
    } else {
        res.status(404).send('Empty Queue\n');
    }
});

router.post('/:id/conclude', (req, res) => {
    var job_id = req.params.id;

    // If job_id is a number
    if(!isNaN(job_id)) {
        var job = jobs[job_id];
        if(job) {
            if(job.Status == "IN_PROGRESS") {
                job.Status = "CONCLUDED";

                console.log(job);

                res.end();
            } else {
                res.status(400).send('Job not in Progress\n');
            }
        } else {
            res.status(404).send('Unknown Job\n');
        }
    } else {
        res.status(400).send('Invalid Job ID\n');
    }
});

router.get('/:id', (req, res) => {
    var job_id = req.params.id;

    // If job_id is a number
    if(!isNaN(job_id)) {
        var job = jobs[job_id];
        if(job) {
            res.send(JSON.stringify(job) + "\n");
        } else {
            res.status(404).send('Unknown Job\n');
        }
    } else {
        res.status(400).send('Invalid Job ID\n');
    }
});

// Add the jobs router to the express app
app.use("/jobs", router);

// Start API Server
app.listen(port, () => {
    console.log(`Listening on port ${port} ...`);
})
