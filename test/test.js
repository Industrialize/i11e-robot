exports['test Robot'] = {
  'test robot': (test) => {
    var createRobot = require('../lib/index')().createRobot;
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
  }
}
