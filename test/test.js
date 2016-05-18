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

  'test robot visitor': function(test) {
    const extension = require('../../i11e-extension/lib/index');

    var MyRobotVisitor = extension.createRobotVisitor({
      initVisitor() {
        this.count = 0;
      },
      willProcess(robot, err, box) {
        this.count++;
      }
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
        .install(new MyRobot())
        .install(new MyRobot())
        .install(new MyRobot())
        .install(new MyRobot())
        .install(new MyRobot());
    });

    pl._()
      .doto(
        (box) => {
          test.equal(box.get('v'), 5);
          //test.equal(myRbtVisitor.count, 5);  // count 5
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
