var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var { connectDB, connectSecondDB,connectDBURI_REWARDS } = require('./config/db'); // Destructure the exports

var env = require('dotenv')
env.config();
var cors = require('cors')
var authRouter = require('./routes/auth')
var departmentRouter = require('./routes/departments')
var designationRouter = require('./routes/designation')
var employeeRouter = require('./routes/employee')
var salaryRouter = require('./routes/salary')
var leaveRouter = require('./routes/leaves')
var settingsRouter = require('./routes/settings')
var dashboardRouter = require('./routes/dashboard')
var fileUploadRouter = require('./routes/file')
var vacationOrRejoinRouter = require('./routes/vacationOrRejoin');
var attendanceRouter = require('./routes/attendance');
var scheduleRouter = require('./routes/Schedule');
var attendanceRemarkRouter = require('./routes/attendanceRemark');
var resignationsRouter = require('./routes/resignations');
var importRouter = require('./routes/import');
var exportdataRouter = require('./routes/exportdata');
var rewardsRouter = require('./routes/rewards');
var compDocRouter = require('./routes/companyDoc');
var vehicleDocRouter = require('./routes/vehicleDocs');


// ✅ Add it right here BEFORE routes


 
var app = express();
app.use(cors({}))
console.log(`PORT: ${process.env.PORT}`);  




// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

connectDB();

// Call the secondDB function to connect to the second database
connectSecondDB();
connectDBURI_REWARDS();




app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public/uploads')));

app.use('/', indexRouter);
app.use('/api/auth' , authRouter)
app.use('/api/department', departmentRouter)
app.use('/api/designation', designationRouter)
app.use('/api/employee', employeeRouter)
app.use('/api/salary', salaryRouter)
app.use('/api/leave', leaveRouter)
app.use('/api/settings', settingsRouter)
app.use('/api/dashboard', dashboardRouter)
app.use('/api/upload', fileUploadRouter)
app.use('/api/vacationOrRejoin', vacationOrRejoinRouter)
app.use('/api/attendance', attendanceRouter)
app.use('/api/schedule', scheduleRouter)
app.use('/api/attendanceRemark', attendanceRemarkRouter)
app.use('/api/resignations', resignationsRouter)
app.use('/api/importdata', importRouter)
app.use('/api/exportdata', exportdataRouter)
app.use('/api/rewards', rewardsRouter)
app.use('/api/company-documents', compDocRouter)
app.use('/api/vehicle-documents', vehicleDocRouter)




// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
