const mongoose = require('mongoose');


const ScheduleSchema = new mongoose.Schema({
    scheduleName: { type: String, required: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department', required: true },
    scheduleA: {
        in: { type: String, },
        out: { type: String,  }
    },
    scheduleB: {
        in: { type: String,  },
        out: { type: String,  }
    },
    scheduleC: {
        in: { type: String,  },
        out: { type: String,  }
    },
    breakTimePeriod: { type: String,  },
    totalScheduleTime: { type: String,  },
    setType:{type: String }
}, { timestamps: true });


const Schedule = mongoose.model('Schedule', ScheduleSchema);
module.exports = Schedule;
