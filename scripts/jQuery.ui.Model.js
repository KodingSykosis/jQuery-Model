/*jslint sub:true,laxbreak:true*/
/*globals window,jQuery*/
/***
 *      Author: KodingSykosis
 *        Date: 12/17/2013
 *     Version: 1.0.0
 *     License: GPL v3 (see License.txt or http://www.gnu.org/licenses/)
 * Description: This widget provides a data/UML model interface
 *
 *        Name: kodingsykosis.model
 *
 *    Requires: jQueryUI 1.8.2 or better
 ***/
(function ($) {
    $.fn.notClicked = function (handler) {
        if (!handler) return this;
        var element = this;

        $(window).click(function (event) {
            var target = $(event.target);
            if (!target.is(element) && element.find(target).length == 0) {
                handler.call(element, $.Event('notClicked', { target: target }));
            }
        });

        return this;
    };


    $.widget("kodingsykosis.model", {
        options: {
            modelSelector: 'ui-model',
            fieldSelector: 'ui-model-field',
            methodSelector: 'ui-model-method'
        },

        // Set up the widget
        _create: function () {
            this.wrap = $('<div>', {
                'class': 'ui-model-wrap'
            });

            this.wrap =
                this.element
                    .wrap(this.wrap)
                    .parent()
                    .draggable()
                    .notClicked($.proxy(this._onNotClicked, this))
                    .on('mousedown', $.proxy(this._onClicked, this));

            this.header = $('<div>', {
                'class': 'ui-model-header ui-widget-header ui-state-default',
                'href': '#',
                'prependTo': this.wrap
            });

            this.title = $('<span>', {
                'class': 'ui-model-header-name',
                'text': this.element.data('entityName') || 'Untitled',
                'appendTo': this.header
            });

            this.trigger =
                this._createTrigger('ui-icon-triangle-1-s')
                    .appendTo(this.header);

            this.element
                .addClass('ui-widget-content')
                .addClass(this.options['modelSelector']);
        },

        _destroy: function() {
            this.header
                .remove();

            this.element
                .unwrap();

            this.element
                .removeClass('ui-widget-content');
        },

        _createTrigger: function(style) {
            return $('<span>', {
                'class': 'ui-model-trigger ui-button ui-widget ui-state-default',
                'on': {
                    'mouseenter': function() { $(this).addClass('ui-state-hover'); },
                    'mouseleave': function() { $(this).removeClass('ui-state-hover'); }
                },
                'append':[$('<span>', { 'class': 'ui-icon ' + style })]
            });
        },

        _onClicked: function(event) {
            this.header
                .addClass('ui-state-active');
        },

        _onNotClicked: function(event) {
            this.header
                .removeClass('ui-state-active');
        }
    });
})(jQuery);