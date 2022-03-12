const express = require('express');
const app = express();
const bodyParser = require("body-parser");
const port = 80;

const GC_ON = (process.env.GC_ON ? process.env.GC_ON : true) == "true";
const GC_INTERVAL_S = Number(process.env.GC_INTERVAL_S ? process.env.GC_INTERVAL_S : 60);
const GC_VALIDITY_S = Number(process.env.GC_VALIDITY_S ? process.env.GC_VALIDITY_S : 60);


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

function log(title, message) {
    var msg = typeof message === 'object' ? JSON.stringify(message, null, 0).replace(/"([^"]+)":/g, '$1:').replace(/\uFFFF/g, '\\\"').replace(/,/g, ", ") : message;
    console.log(`[${(new Date()).toISOString()}] [${title}] : ${msg}`);
}

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

async function GarbageCollector() {
    var deleted = 0;
    for (job_id in jobs) {
        var job = jobs[job_id];

        // Job is concluded and expired
        if(job.Status == "CONCLUDED" && job.ConcludedTS && (job.ConcludedTS + GC_VALIDITY_S*1000 <= Date.now())) {
            log("DELETE", job);

            delete jobs[job.ID];
            delete job;

            deleted++;
        }
    }

    log("GC", `Deleted ${deleted} jobs`);
}

// API Endpoints
router.post('/enqueue', (req, res) => {
    if(isValidJob(req.body)) {
        // Add new job to queue
        var job_id = nextJobID();
        var job = { ID: job_id, Status: "QUEUED", CreatedTS: Date.now(), ...req.body };

        jobs[job_id] = job;
        job_queue.unshift(job);

        log('ENQUEUE', job);

        res.send(job_id.toString() + "\n");
    } else {
        res.status(400).send('Invalid Job\n');
    }
});

router.get('/dequeue', (req, res) => {
    var consumer_id = req.get("QUEUE_CONSUMER");
    if(consumer_id) {
        var job = job_queue.pop();
        if(job) {
            job.Status = "IN_PROGRESS";
            job.ConsumerID = consumer_id;

            log('DEQUEUE', job);

            res.send(JSON.stringify(job) + "\n");
        } else {
            res.status(404).send('Empty Queue\n');
        }
    } else {
        res.status(400).send('Missing QUEUE_CONSUMER Header\n');
    }
});

router.post('/:id/conclude', (req, res) => {
    var job_id = req.params.id;
    var consumer_id = req.get("QUEUE_CONSUMER");

    if(consumer_id) {
        // If job_id is a number
        if(!isNaN(job_id)) {
            var job = jobs[job_id];
            if(job) {
                if(job.Status == "IN_PROGRESS") {
                    if(job.ConsumerID == consumer_id) {
                        job.Status = "CONCLUDED";
                        job.ConcludedTS = Date.now();

                        log('CONCLUDE', job);

                        res.end();
                    } else {
                        res.status(400).send('Wrong QUEUE_CONSUMER\n');
                    }
                } else {
                    res.status(400).send('Job not in Progress\n');
                }
            } else {
                res.status(404).send('Unknown Job\n');
            }
        } else {
            res.status(400).send('Invalid Job ID\n');
        }
    } else {
        res.status(400).send('Missing QUEUE_CONSUMER Header\n');
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

    // Start GarbageCollector
    if(GC_ON)
        setInterval(GarbageCollector, GC_INTERVAL_S*1000);

    console.log(`Listening on port ${port} ...`);
});

/*
Final notes:
There should be a garbage collector or other mechanism to clean the concluded jobs from memory after a while.
I did not implement such feature as I assumed it was not necessary for demonstration purposes.
*/
