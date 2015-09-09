/**
 * @classdesc
 * EventDispatcher
 * 
 * @class EventDispatcher
 * @this {RC.EventDispatcher}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 */

(function(namespace) {
    var EventDispatcher = function(O) {

        var me = {};
        me.class = this;

        me._functions = [];
        me._context = window;

        me.add = function(func, is_start) {
            me._functions.push({"is_start": is_start != undefined ? is_start : true, "func": func});
            return me._functions.length-1;

        };

        me.remove = function(index) {
            delete( me._functions[index] );
        };

        me.get = function(index) {
            return me._functions[index];
        };

        me.stop = function(index) {
            me._functions[index]["is_start"] = false;
        };

        me.start = function(index) {
            me._functions[index]["is_start"] = true;
        };

        me.isStart = function(index) {
            return me._functions[index]["is_start"];
        };

        me.call = function(value, context) {
            var context = context ? context : me._context;

            for(i in me._functions) {
                var task = me._functions[i];
                if(task["is_start"]) {
                    task["func"].call(context, value);

                }
            };

        };

        me.isEmpty = function() {
            return me._functions.length == 0;

        };

        me.setConfig = function(O) {
            for(prop in O) {
                switch(prop) {
                    case "context": {
                        this._context = O[prop];
                    };break;

                };    
            };

        };

        /**
        * Constructor
        *
        * @method EventDispatcher.Constructor
        * @this {RC.EventDispatcher}
        * @EventDispatcher {Object} O
        * @EventDispatcher {Object} O.self         Context for calling
        */
        me.Constructor = function(O) {
            this.setConfig(O);
            
        };

        me.Constructor(O);

        return me;

    };
    
    namespace.EventDispatcher = EventDispatcher;

})(window.VRC);