var defaultDelegate = {
  isSync() {return false},
  getModel() {return 'PassThroughRobot'},
  process(box, done) {
    done(null, box);
  }
};


var exports = {};

var visitors = [];


/**
 * Robot creator: create a Robot with a delegate object
 *
 * Delegate object could contain following methods
 * - isSync(): optional, must return true or false to indicate the robot mode,
 * default: false
 * - getModel(): optional, return the model name of this new Robot class
 * - process(box, done): process a box on production line and put it back to production line
 *
 * @param  {object} delegate robot delegate object
 * @return {Function}          a new robot creater function
 */
exports.createRobot = (delegate) => {
  const ReserverdFunctions = ['setDelegate', 'input', 'output', 'comment',
    'process', 'examples', 'getId', 'getModel', 'isSync', 'isFilter'];
  const createError = require('i11e-utils').error;
  const Sequence = {
    newName() {
      var Moniker = require('moniker');
      return Moniker.choose();
    }
  };

  if (!delegate) {
    delegate = defaultDelegate;
  }

  /**
   * Robot class
   */
  class Robot {
    /**
     * Constructor of Robot
     * @param  {Object} options   robot settings
     * @return {Robot}         robot instance
     */
    constructor(options = {}) {
      this.__type__ = 'robot';
      this.options = options; // robot options

      this.setDelegate(delegate);

      // robot instance properties
      this.id = Sequence.newName(); // robot id
      this.name = options.name || this.id; // robot name, could be initiated from options
      this.comment = options.comment || ""; // comment of this robot, could be initiated from options

      // robot class properties
      this.model = this.delegate.getModel ? this.delegate.getModel() : "Unnamed Model"; // robot model
      this.sync = this.delegate.isSync ? this.delegate.isSync() : false;  // robot working mode: sync or async, default async
      this.filter = this.delegate.isFilter ? this.delegate.isFilter() : false;
      if (this.filter) this.sync = true;  // filter must be sync

      // init the robot by delegation
"#if process.env.NODE_ENV !== 'production'";
      // pre processing of robot initiation
      var skip = this.preInit();

      // robot initiation if it is not skipped by the pre processing
      if (!skip) {
        if (this.delegate.initRobot) {
          try {
            this.delegate.initRobot.call(this);
          } catch (err) {
            console.error(`Error when initiating robot ${this.model}` )
            console.error(err.message);
            console.error(err.stack);
          }
        }
      }

      // post processing of robot initiation
      this.postInit();
"#endif";

"#if process.env.NODE_ENV === 'production'";
      if (this.delegate.initRobot) {
        if (this.delegate.initRobot) {
          try {
            this.delegate.initRobot.call(this);
          } catch (err) {
            console.error(`Error when initiating robot ${this.model}` )
            console.error(err.message);
            console.error(err.stack);
          }
        }
      }
"#endif";
    }

    /**
     * Set the robot delegate
     * @internal
     * @param {Object} delegate the delegate object
     */
    setDelegate(delegate) {
      this.delegate = delegate;

      if (!this.delegate.process) {
        // default process method
        this.delegate.process = (box, done) => {
          if (done) done(null, box);
          else return box;
        }
      }

      for (let key in this.delegate) {
        // skip predefined functions
        if (ReserverdFunctions.indexOf(key) >= 0) {
          continue;
        }

        if (typeof this.delegate[key] === 'function') {
          this[key] = this.delegate[key].bind(this);
        }
      }

      return this;
    }

    /**
     * Get robot id
     * @return {String} robot id
     */
    getId() {
      return this.id;
    }

    /**
     * Get robot name
     * @return {string} robot name
     */
    getName() {
      return this.name;
    }

    /**
     * Get robot model
     * @return {String} robot model
     */
    getModel() {
      return this.model;
    }

    /**
     * Get robot working mode, sync or async
     * @return {Boolean} true if async mode otherwise false
     */
    isSync() {
      return this.sync;
    }

    /**
     * If the robot is a filter
     */
    isFilter() {
      return this.filter;
    }

    doFilter(box) {
"#if process.env.NODE_ENV !== 'production'";
      var skip = this.preFilter(this, box);

      var pass = true;
      var error = null;
      if (!skip) {
        try {
          pass = this.delegate.process.call(this, box);
        } catch (err) {
          error = err;
        }
      }

      var newPass = this.postFilter(error, box, pass);
      if (newPass === null || newPass === undefined) {
        return pass;
      }
      return newPass;
"#endif";

"#if process.env.NODE_ENV === 'production'";
      try {
        return this.delegate.process.call(this, box);
      } catch (err) {
        throw createError(500, err, box);
      }
"#endif";
    }

    doSyncProcess(box) {
"#if process.env.NODE_ENV !== 'production'";
      var skip = this.preProcess(box);

      var returnBox = box;
      var error = null;
      if (!skip) {
        try {
          returnBox = this.delegate.process.call(this, box);
        } catch (err) {
          error = err;
        }
      }

      this.postProcess(error, returnBox);

      return returnBox;
"#endif";

"#if process.env.NODE_ENV === 'production'";
      try {
        return this.delegate.process.call(this, box);
      } catch (err) {
        throw createError(500, err, box);
      }
"#endif";
    }

    doAsyncProcess(box, done) {
"#if process.env.NODE_ENV !== 'production'";
      var skip = this.preProcess(box);

      if (!skip) {
        try {
          this.delegate.process.call(this, box, (err, result) => {
            this.postProcess(err, result);
            done(err, result);
          });
        } catch (err) {
          this.postProcess(err, box);
          done(err, box);
        }
      }
"#endif";

"#if process.env.NODE_ENV === 'production'";
      try {
        return this.delegate.process.call(this, box, done);
      } catch (err) {
        done(createError(500, err, box), box);
      }
"#endif";
    }

    /**
     * Process the box, or filter the box
     * @param  {Box}   box  the box object to process
     * @param  {Function} done callback function used to put err or processed box back to production line
     * @return {Box}        only return processed box when in sync mode
     */
    process(box, done) {
      if (this.isSync()) {
        if (this.isFilter()) {
          return this.doFilter(box);
        } else {
          return this.doSyncProcess(box);
        }
      } else {
        return this.doAsyncProcess(box, done);
      }
    }

    /**
     * Pre initiate the robot, return true to skip the init process
     * @return {Boolean} skip the init process or not
     */
    preInit() {
      var skip = false;
      for (let visitor of visitors) {
        if (visitor.accept(this) && visitor.willInit(this)) {
          skip = true;
        }
      }

      return skip;
    }

    /**
     * Post initiate the robot
     */
    postInit() {
      for (let visitor of visitors) {
        if (visitor.accept(this)) {
          visitor.didInit(this);
        }
      }
    }

    /**
     * pre filter the box
     * @param  {box} box the box to process
     * @return {Boolean}     skip the filter or not
     */
    preFilter(box) {
      var skip = false;
      for (let visitor of visitors) {
        if (visitor.accept(this, box) && visitor.willProcess(this, box)) {
          skip = true;
        }
      }

      return skip;
    }

    /**
     * post filter the box
     * @param  {error} error error occurs in the filtering process
     * @param  {Box} box   the box to process
     * @param  {Boolean} pass  the filtering result
     * @return {Boolean}       the new filtering result
     */
    postFilter(error, box, pass) {
      var newPass = pass;
      for (let visitor of visitors) {
        if (visitor.accept(this, box) && !visitor.didProcess(this, error, box, pass)) {
          newPass = false;
        }
      }

      if (error) {
        throw createError(500, error, box);
      }

      return newPass;
    }

    /**
     * pre process the box
     * @param  {box} box the box to process
     * @return {Boolean}     skip the processing or not
     */
    preProcess(box) {
      var skip = false;
      for (let visitor of visitors) {
        if (visitor.accept(this, box) && visitor.willProcess(this, box)) {
          skip = true;
        }
      }

      return skip;
    }

    /**
     * post process the box
     * @param  {error} error the error generated from procecssing
     * @param  {box} box   the box processed
     */
    postProcess(error, box) {
      for (let visitor of visitors) {
        if (visitor.accept(this, box)) {
          visitor.didProcess(this, error, box);
        }
      }

      if (error) {
        throw createError(500, error, box);
      }
    }

    /**
     * Input descriptor/validator
     * @return {Object | Function} input descriptor or validator
     */
    static input() {
      if (this.delegate.input) return this.delegate.input();
      return null;
    }

    /**
     * Output descriptor/validator
     * @return {Object | Function} output descriptor or validator
     */
    static output() {
      if (this.delegate.output) return this.delegate.output();
      return null;
    }

    /**
     * Examples
     * @return {Array} array of examples
     */
    static examples() {
      if (delegate.examples) {
        return delegate.examples();
      }
      return [];
    }

    static isRobot(object) {
      return typeof object === 'object' && object !== null && object.__type__ == 'robot';
    }
  }

  return Robot;
}

exports.robot = (fn, options = {}) => {
  if (!options.name) options.name = 'Anonymous';
  if (!options.model) options.model = 'Unnamed Model';
  if (!options.comment) options.comment = options.model;
  if (!options.sync) options.sync = false;

  var RobotModel = exports.createRobot({
    getModel() {
      return options.model || 'Unnamed Model';
    },

    isSync() {
      return options.sync;
    },

    isFilter() {
      return false;
    },

    process(box, done) {
      if (options.sync) {
        return fn(box);
      } else {
        fn(box, done);
      }
    }
  });

  return new RobotModel({
    name: options.name,
    comment: options.comment
  });
}

exports.filter = (fn, options = {}) => {
  if (!options.name) options.name = 'Anonymous';
  if (!options.model) options.model = 'Unnamed Model';
  if (!options.comment) options.comment = options.model;

  var RobotModel = exports.createRobot({
    getModel() {
      return options.model || 'Unnamed Model';
    },

    isSync() {
      return true;
    },

    isFilter() {
      return true;
    },

    process(box) {
      return fn(box);
    }
  });

  return new RobotModel({
    name: options.name,
    comment: options.comment
  });
}

/**
 * extend the module with extensions
 * @param  {Extenstion} extensions Array of extenstions
 */
exports.extend = function (extensions) {
  var rbtVisitors = extensions.getRobotVisitors();
  for (var visitor of rbtVisitors) {
    visitors.push(visitor);
  }
}

module.exports = exports;
