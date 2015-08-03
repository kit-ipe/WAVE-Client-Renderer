/**
 * @classdesc
 * AdaptationManager
 * 
 * @class AdaptationManager
 * @this {AdaptationManager}
 * @author sogimu@nxt.ru Aleksandr Lizin aka sogimu
 * @version 0.1
 *
 */

(function(namespace) {
    var AdaptationManager = function() {

        var me = {};

        me._core = {};

        me._possible_steps = [64, 128, 256, 512, 1024, 2048, 4096, 8192];
        // me._possible_steps = [10, 20, 50, 80, 100, 150, 200];
        me._current_steps_index = 0;
        me._is_auto_updating = true;

        me.init = function(core) {
            me._core = core;

            me._core.onDraw.Add(function(fps) {
                me.do(fps);
            });

        };

        me.setPossibleSteps = function(possible_steps) {
            me._possible_steps = possible_steps;
        };

        me.switchOn = function(flag) {
            me._is_auto_updating = flag;
        };

        me.adaptToStep = function(steps_number) {
            last_step_index    = 0;
            current_step_index = 0;

            for(var i=0; i<me._possible_steps.length; i++) {
                last_step    = me._possible_steps[ last_step_index ];
                current_step = me._possible_steps[ current_step_index ];

                if(steps_number >= last_step && steps_number < current_step) {
                    me._current_steps_index = last_step_index;
                    return;
                };

                last_step_index = current_step_index;
                current_step_index++;

            };

            me._current_steps_index = me._possible_steps.length-1;
        };

        me._prevTime = Date.now();
        me._fps = 0;
        me._frames = 0;
        
        me.do = function(fps) {
            if(me._is_auto_updating == true) {
                if(fps < 35 && me._current_steps_index > 0) {
                    // stepHelper.decreaseSteps();
                    me._current_steps_index--;
                    me._core.setSteps( me._possible_steps[me._current_steps_index] );

                } else if(fps > 55 && me._current_steps_index < me._possible_steps.length-1 ) {
                    // stepHelper.increaseSteps();
                    me._current_steps_index++;
                    me._core.setSteps( me._possible_steps[me._current_steps_index] );

                }

                // me.adaptToStep( me._core.getSteps() );

                // if(fps > 60 && me._possible_steps.length-1 > me._current_steps_index) {
                //     me._current_steps_index++;
                //     me._core.setSteps( me._possible_steps[me._current_steps_index] );
                // };

                // if(fps < 30 && me._current_steps_index > 0) {
                //     me._current_steps_index--;
                //     me._core.setSteps( me._possible_steps[me._current_steps_index] );
                // };

                console.log(fps, me._current_steps_index, me._possible_steps[me._current_steps_index]);

                // me._core.setSteps( me._possible_steps[me._current_steps_index] );

            };

        };

        return me;

    };

    namespace.AdaptationManager = AdaptationManager;

})(window.RC);