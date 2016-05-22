# i11e robot

## Usage:

### create a robot

You can create a new Robot model with *createRobot* method

```javascript
const Robot = require('i11e-robot');

var MyRobot = Robot.createRobot({
  initRobot() {
    // optional, init your robot here
    console.log(this.options);
  },

  getModel() {
    return 'MyRobotModel';  // optional, the model name. default: Unnamed Robot
  },

  isSync() {
    return false;   // optional, if the robot works in sync model, default: false;
  },

  process(box, done) {
    // process the box and return it with done callback (async mode)
    done(null, box);  // accepts an error and the return box
  }
});

var robotInstance = new Robot({
  //options
});
```

### create a sync robot

You can create a sync robot with *isSync()* method returning true. In sync mode, the *process(box)* method does not accept the second callback function, instead, it returns the box directly.

```javascript
const Robot = require('i11e-robot');

var MySyncRobot = Robot.createRobot({
  getModel() {return 'MySyncRobot'},
  isSync() {return true},
  process(box) {
    box.set('v', 100);
    return box;
  }
});

var mySyncRobot = new MySyncRobot();
```

### create a filter

A filter is a special robot, which returns a boolean value to indicate if the box need to be processed or not. You need to implement the *isFilter()* method and return true to turn the robot in filter mode.

> Note: a filter MUST work in sync mode, you don't need to implement the *isSync()* method, as it will automatically set to *true* when working in filter mode.

```javascript
const Robot = require('i11e-robot');

var MyFilter = Robot.createRobot({
  isFilter() {return true},
  process(box) {
    return box.get('v') > 100; // only process the box with v greater than 100
  }
});

var myFilter = new MyFilter();
```

### shortcuts to create robot/filter

Besides the *createRobot* method, there are three shortcut methods to help you create robot / filter.

- **Robot.robot(fn, options)**
- **Robot.filter(fn, options)**

#### Robot.robot(fn, options)

Create a robot instance with a function

- fn: function (box, done) if options.sync = false otherwise function (box)
- options:
  - name: the name of the robot
  - model: the model of the robot
  - comment: the comment of the robot
  - sync: the working mode of the robot, default false

```javascript
const Robot = require('i11e-robot');
var myRobot = Robot.robot((box, done) => {
  box.set('greeting', 'Hello World!');
  done(null, box);
});
```

#### Robot.filter(fn, options)

Create a filter robot with a function
- fn: function (box, done) if options.sync = false otherwise function (box)
- options:
  - name: the name of the robot
  - model: the model of the robot
  - comment: the comment of the robot

```javascript
const Robot = require('i11e-robot');
var filter = Robot.filter((box) => {
  return box.get('v') > 100;
});
```
