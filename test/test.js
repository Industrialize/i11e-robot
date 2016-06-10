exports['test Robot'] = {
  'test robot': (test) => {
    var createRobot = require('../lib/index').createRobot;
    var Box = require('i11e-box');
    var Robot = createRobot({
      input() {
        return {
          "a:&": 10,
          "b:&": 20
        };
      },

      output() {
        return {
          c: (v, box) => {
            return v === box.get('a') + box.get('b') * this.options.k;
          },
        };
      },

      process(box, done) {
        const a = box.get('a');
        const b = box.get('b');

        box.set('c', a + b * this.options.k);

        done(null, box);
      }
    });

    var robot = new Robot({
      k: 10
    });

    robot.process(new Box({
      a: 1,
      b: 2,
    }), function(err, box) {
      test.equal(box.get('c'), 21);
      test.done();
    });
  },

  'test filter': (test) => {
    const Robot = require('../lib');
    const Pipeline = require('i11e-pipeline');

    var MyRobot = Robot.createRobot({
      isFilter() {
        return true;
      },

      process(box) {
        var ret = box.get('v') > 10;
        return ret;
      }
    });

    var pl = Pipeline.pipeline();

    var count = 0;
    pl._()
      .doto((box) => {
        count++;
        if (count >= 2) {
          test.done();
        }
      })
      .install(new MyRobot())
      .doto((box) => {
        if (box.get('v') <= 10) {
          test.ok(false);
        }
      })
      .drive();

    pl.$()
      .push({v: 11})
      .push({v: 1})

  },

  'test robot shortcut': function(test) {
    const Robot = require('../lib/index');

    var greetingRobot = Robot.robot((box, done) => {
      box.set('greeting', 'Hello World');
      done(null, box);
    }, {
      name: 'test greeting robot',
      model: 'GreetingRobot',
      comment: `just a test for robot shortcut`
    });

    const Pipeline = require('i11e-pipeline');

    var pl = Pipeline.pipeline();
    pl._()
      .install(greetingRobot)
      .doto((box) => {
        test.equal(box.get('greeting'), 'Hello World');
        test.done();
      })
      .drive();

    pl.$().push({});
  },

  'test filter shortcut': function(test) {
    const Robot = require('../lib/index');

    var filterRobot = Robot.filter((box) => {
      return box.get('v') > 100;
    }, {
      name: 'test filter',
      model: 'GreaterThan100FilterRobot',
      comment: `just a test for filter shortcut`
    });

    const Pipeline = require('i11e-pipeline');

    var count = 0;
    var pl = Pipeline.pipeline();
    pl._()
      .doto((box) => {
        count++;
      })
      .install(filterRobot)
      .doto((box) => {
        if (count >= 2) test.done();
      })
      .drive();

    pl.$()
      .push({v: 100})
      .push({v: 101})
  },

  'test robot visitor': function(test) {
    const extension = require('../../i11e-extension/lib/index');

    var MyRobotVisitor = extension.createRobotVisitor({
      initVisitor() {
        this.count = 0;
      },
      accept() {
        return true;
      },
      willInit(robot) {},
      didInit(robot) {},
      willProcess(robot, box) {
        this.count++;
      },
      didProcess(robot, err, box) {}
    });

    var myRbtVisitor = new MyRobotVisitor();
    const Robot = require('../lib/index');

    Robot.extend({
      getRobotVisitors() {
        return [myRbtVisitor]
      }
    });

    var MyRobot = Robot.createRobot({
      process(box, done) {
        var v = box.get('v');
        if (v === null || v === undefined) {
          v = 0;
        }

        v++;
        done(null, box.set('v', v));
      }
    });

    const Pipeline = require('i11e-pipeline');

    var pl = Pipeline.pipeline((source) => {
      return source._()
        .next(new MyRobot())
        .install(new MyRobot())
        .install(new MyRobot())
        .install(new MyRobot())
        .install(new MyRobot());
    });

    pl._()
      .doto(
        (box) => {
          test.equal(box.get('v'), 5);
          test.equal(myRbtVisitor.count, 5);  // count 5
          test.done();
        }
      )
      .errors((err)=>{
        console.error(err.stack)
        test.done();
      })
      .drive();

    pl.$().push({});
  }
}
