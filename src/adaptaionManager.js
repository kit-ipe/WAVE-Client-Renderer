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

        me._possible_steps = [32, 64, 128, 256, 512, 1024];
        // me._possible_steps = [10, 20, 50, 80, 100, 150, 200];
        me._current_steps_index = 0;

        me._onPostDrawFuncIndex = -1;
        me._onCameraChangeStartFuncIndex = -1;
        me._onCameraChangeEndFuncIndex = -1;

        me.init = function(core) {
            me._core = core;

            me._onPostDrawFuncIndex = me._core.onPostDraw.Add(function(fps) {
                me.do(fps);
            });

            me._onCameraChangeStartFuncIndex = me._core.onCameraChangeStart.Add(function() {
                me.pause(true);

            });

            me._onCameraChangeEndFuncIndex = me._core.onCameraChangeEnd.Add(function() {
                me.pause(false);
            });

        };

        me.setPossibleSteps = function(possible_steps) {
            me._possible_steps = possible_steps;
        };

        me.run = function(flag) {
            if(flag) {
                me._core.onPostDraw.Start(me._onPostDrawFuncIndex);
                me._core.onCameraChangeStart.Start(me._onCameraChangeEndFuncIndex);
                me._core.onCameraChangeEnd.Start(me._onCameraChangeStartFuncIndex);

            } else {
                me._core.onPostDraw.Stop(me._onPostDrawFuncIndex);
                me._core.onCameraChangeStart.Stop(me._onCameraChangeEndFuncIndex);
                me._core.onCameraChangeEnd.Stop(me._onCameraChangeStartFuncIndex);
               
            }

        };

        me.pause = function(flag) {
            if(flag) {
                me._core.onCameraChangeStart.Stop(me._onCameraChangeEndFuncIndex);
                me._core.onPostDraw.Stop(me._onPostDrawFuncIndex);
             

            } else {
                me._core.onCameraChangeStart.Start(me._onCameraChangeEndFuncIndex);
                me._core.onPostDraw.Start(me._onPostDrawFuncIndex);

            }

        };

        me.decreaseSteps = function() {
            me._current_steps_index--;
            me._core.setSteps( me.getSteps() );
        };

        me.increaseSteps = function() {
            me._current_steps_index++;
            me._core.setSteps( me.getSteps() );
        };

        me.getSteps = function() {
            return me._possible_steps[me._current_steps_index];
        };

        me.isRun = function() {
            var isRunOnPostDraw = me._core.onPostDraw.IsRun(me._onPostDrawFuncIndex)
            var isRunOnCameraChangeStart = me._core.onCameraChangeStart.IsRun(me._onCameraChangeEndFuncIndex);
            var isRunOnCameraChangeEnd = me._core.onCameraChangeEnd.IsRun(me._onCameraChangeStartFuncIndex);

            return isRunOnPostDraw && isRunOnCameraChangeStart && isRunOnCameraChangeEnd;
        };

        me.isPause = function() {
            var isRunOnPostDraw = me._core.onPostDraw.IsRun(me._onPostDrawFuncIndex)
            var isRunOnCameraChangeStart = me._core.onCameraChangeStart.IsRun(me._onCameraChangeEndFuncIndex);
            var isRunOnCameraChangeEnd = me._core.onCameraChangeEnd.IsRun(me._onCameraChangeStartFuncIndex);

            return !isRunOnPostDraw && !isRunOnCameraChangeStart && isRunOnCameraChangeEnd;
        };

        me.do = function(fps) {
            if( fps < 15 && me._current_steps_index > 0 ) {
                console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
                me.decreaseSteps();

            } else if( fps > 40 && me._current_steps_index < me._possible_steps.length-1 ) {
                console.log("FPS: " + fps + ", Number of steps: " + me.getSteps() );
                me.increaseSteps();

            }

        };

        return me;

    };

    namespace.AdaptationManager = AdaptationManager;

})(window.RC);