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
  const ReserverdFunctions = ['setDelegate', 'filter', 'input', 'output', 'comment', 'process', 'examples', 'getId', 'getModel', 'isSync'];
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
      this.id = Sequence.newName(); // robot id
      this.model = "Unnamed Model"; // robot model
      this.options = options; // robot options
      this.sync = false;  // robot working mode: sync or async, default async
      this.comment = options.comment || "";

      this.setDelegate(delegate);

"#if process.env.NODE_ENV !== 'production'";
      var skip = false;
      for (let visitor of visitors) {
        if (typeof visitor.willCreate === 'function' && visitor.willCreate(this)) {
          skip = true;
        }
      }

      if (!skip) {
        if (this.delegate.initRobot) {
          this.delegate.initRobot.call(this);
        }
      }
"#endif";

"#if process.env.NODE_ENV === 'production'";
      if (this.delegate.initRobot) {
        this.delegate.initRobot.call(this);
      }
"#endif";

"#if process.env.NODE_ENV !== 'production'";
      for (let visitor of visitors) {
        if (typeof visitor.didCreate === 'function') visitor.didCreate(this);
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

      if (this.delegate.getModel) this.model = this.delegate.getModel();
      if (this.delegate.isSync) this.sync = this.delegate.isSync();

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
     * @return {[type]} [description]
     */
    getId() {
      return this.id;
    }

    /**
     * Get robot model
     * @return {[type]} [description]
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
     * Filter the box to process
     * @param  {Box} box the box
     * @return {Boolean}     true if accept otherwise false
     */
    filter(box) {
"#if process.env.NODE_ENV !== 'production'";
      var filterRet = true;

      for (let visitor of visitors) {
        filterRet = (typeof visitor.willFilter === 'function') ? visitor.willFilter(this, box) : null;
        if (filterRet === false) {
          return false;
        } else if (filterRet === true) {
          return true;
        } else {
          // continue
        }
      }
"#endif";

      var passOrNot = true;

      if (this.delegate.filter) passOrNot = this.delegate.filter.call(this, box);

"#if process.env.NODE_ENV !== 'production'";
      for (let visitor of visitors) {
        filterRet = (typeof visitor.didFilter === 'function') ? visitor.didFilter(this, box, passOrNot) : null;
        if (filterRet === false) {
          return false;
        } else if (filterRet === true) {
          return true;
        } else {
          // continue
        }
      }
"#endif";
      return passOrNot;
    }

    /**
     * Process the box
     * @param  {Box}   box  the box object to process
     * @param  {Function} done callback function used to put err or processed box back to production line
     * @return {Box}        only return processed box when in sync mode
     */
    process(box, done) {
"#if process.env.NODE_ENV !== 'production'";
      var skip = false;
      for (let visitor of visitors) {
        skip = (typeof visitor.willProcess === 'function') ? visitor.willProcess(this, box) : null;
        if (skip) skip = true;
      }

      // skip process if necessary
      if (skip) {
        for (let visitor of visitors) {
          if (typeof visitor.didProcess === 'function') visitor.didProcess(this, null, box);
        }
        if (this.sync) {
          return box;
        } else {
          return done(null, box);
        }
      } // PROCESS END HERE IF SKIP === true

      try {
        var ret =  this.delegate.process.call(this, box, (err, result) => {
          if (!this.sync) {
            // for async mode
            for (let visitor of visitors) {
              if (typeof visitor.didProcess === 'function') visitor.didProcess(this, err, result);
            }
            done(err, result);
          }
        });

        // for sync mode
        if (this.sync) {
          for (let visitor of visitors) {
            if (typeof visitor.didProcess === 'function') visitor.didProcess(this, null, box);
          }
        }

        return ret;
      } catch (err) {
        if (this.sync) {
          for (let visitor of visitors) {
            if (typeof visitor.didProcess === 'function') visitor.didProcess(this, null, box);
          }
          throw createError(500, err, box);
        } else {
          done(createError(500, err, box), box);
        }
      }
"#endif";

"#if process.env.NODE_ENV === 'production'";
      try {
        return this.delegate.process.call(this, box, done);
      } catch (err) {
        if (this.sync) {
          throw createError(500, err, box);
        } else {
          done(createError(500, err, box), box);
        }
      }
"#endif";
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

/**
 * extend the module with extensions
 * @param  {Extenstion} extensions Array of extenstions
 */
exports.extend = function (extensions) {
  visitors = extensions.getRobotVisitors();
}

module.exports = exports;
