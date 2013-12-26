/*jslint sub:true,laxbreak:true,browser:true*/
/*globals jQuery*/
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

    /***********************************
    **     My new friend
    ***********************************/
    if (typeof $.fn.notClicked === 'undefined')
    $.fn.notClicked = function (handler) {
        return this.each(function() {
            var element = $(this);

            if (typeof handler === 'function')
            $(window).click(function (event) {
                var target = $(event.target);
                if (!target.is(element) && element.find(target).length === 0) {
                    handler.call(element, $.Event('notClicked', { target: target }));
                }
            });
        });
    };

    /***********************************
    **     Helper plugins
    **     Maybe should be apart of widget?
    ***********************************/

    $.extend({
        menu: function(items, options) {
            var menu = $('<ul>', {
                'class': 'ui-menu',
                'css': {
                    'display': 'none',
                    'position': 'relative',
                    'float': 'left'
                }
            });

            if (items.options || !options) {
                options = items.options;
            }

            if (items.menuItems) {
                items = items.menuItems;
            }

            for(var i = 0, len = items.length; i < len; i++) {
                $.menuItem(items[i], menu);
            }

            return menu.menu(options);
        },
        menuItem: function(data, menu) {
            var separator = data.title === '-';
            var item = $('<li>', {
                'class': 'ui-menu-item' + (data['class'] || ''),
                'appendTo': menu
            });

            if (separator) {
                item.addClass('ui-menu-divider');
            } else {
                $('<a>', {
                    'id': data.id,
                    'name': data.name,
                    'href': data.url || '#',
                    'title': data.title,
                    'text': data.title,
                    'click': data.handler || function() { menu.triggerHandler('menuitem' + data.name); },
                    'appendTo': item
                });
            }

            return item;
        },
        dropdown: function(items, selected) {
            var elem = $('<select>');

            for(var i = 0, len = items.length; i < len; i++) {
                var item = items[i],
                    val = typeof item === 'object' && typeof item.value === 'string' ? item.value : item,
                    txt = typeof item === 'object' && typeof item.text === 'string' ? item.text : item;

                $('<option>', {
                    'value': val,
                    'text': txt,
                    'selected': val === selected,
                    'appendTo': elem
                });
            }

            return elem;
        }
    });

    $.fn.extend({
        edit: function(editFn, readonlyFn, toggle, dataProp) {
            var fn = (typeof toggle === 'undefined' || toggle === true) ? editFn : readonlyFn;
            return this.each(function(idx, elem) {
                var $elem = $(elem);
                $elem.empty()
                     .append(fn.call(elem, $elem.data(dataProp)));
            });
        }
    });

    $.kodingsykosis = {
        dataTypes: [
            'String',
            'Boolean',
            'Int16',
            'Int23',
            'Int64',
            'Float',
            'UUID',
            'DateTime',
            'Guid',
            'Char'
        ]
    };

    $.widget("kodingsykosis.model", {
        options: {
            fieldSelector: '.ui-model-field',
            methodSelector: '.ui-model-method',
            menuItems: [
                { title: 'Edit', name: 'edit' },
                { title: '-' },
                { title: 'Remove', name: 'remove' }
            ]
        },

        /***********************************
        **     jQueryUI Widget Interface
        ***********************************/

        _create: function () {
            this.wrap = $('<div>', {
                'class': 'ui-model-wrap'
            });

            this.wrap =
                this.element
                    .wrap(this.wrap)
                    .parent()
                    .draggable({
                        handle: '.ui-model-header'
                    })
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
                    .click($.proxy(this._onToggleMenu, this))
                    .appendTo(this.header);

            this.menu =
                $.menu(this.options['menuItems'])
                 .appendTo('body')
                 .on('menuitemedit', $.proxy(this._onEditClicked, this))
                 .on('menuitemremove', $.proxy(this._onRemoveClicked, this));

            this.element
                .addClass('ui-widget-content ui-model');

            this.fields =
                this.element
                    .children(this.options['fieldSelector']);

            this.methods =
                this.element
                    .children(this.options['methodSelector']);

            this.isReadonly(true);
        },

        _destroy: function() {
            this.menu
                .remove();

            this.header
                .remove();

            this.element
                .unwrap();

            this.element
                .removeClass('ui-widget-content');
        },

        /***********************************
        **     Public methods
        ***********************************/

        isReadonly: function(value) {
            if (typeof value === 'boolean') {
                this.element
                    .toggleClass('ui-model-editing', !value);

                this.fields
                    .edit(this._mkEditableField,
                          this._mkReadonlyField,
                          value === false);
            }

            return !this.element.is('.ui-model-editing');
        },

        /***********************************
        **     Helper Methods
        ***********************************/

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

        //Executed out of scope
        _mkEditableField: function(data) {
            var elem = $(this);
            var dType =
                $.dropdown($.kodingsykosis.dataTypes, elem.data('type'))
                 .addClass('ui-model-data-type')
                 .change(function() {
                    elem.data('type', $(this).val());
                 });

            var fName =
                $('<input>', {
                    'type': 'text',
                    'class': 'ui-model-field-name',
                    'value': data.name,
                    'change': function() {
                        elem.data('name', $(this).val());
                    }
                });

            var container =
                $('<div>', {
                    append: fName.add(dType)
                });

            dType.DropDown({
                allowEmpty: false
            });

            return container;
        },

        _mkReadonlyField: function(data) {
            return '- ' + data.name + ' : ' + data.type;
        },

        /***********************************
        **     Event Delegates
        ***********************************/

        _onClicked: function(event) {
            this.header
                .addClass('ui-state-active');
        },

        _onNotClicked: function(event) {
            if (this.menu.is(':visible')) {
                this.menu
                    .slideUp(120);
            }

            if (this.menu.find(event.target).length || this.menu.is(event.target)) return;

            this.header
                .removeClass('ui-state-active');
        },

        _onToggleMenu: function(event) {
            if (this.menu.is(':visible')) {
                this.menu
                    .slideUp(120);
            } else {
                this.menu
                    .css('display', 'block')
                    .position({
                        my: 'left top',
                        at: 'right top',
                        of: this.trigger,
                        collision: 'flipfit fit'
                    })
                    .css('display', 'none')
                    .slideDown(120);
            }
        },

        _onEditClicked: function(event) {
            this.isReadonly(!this.isReadonly());
        },

        _onRemoveClicked: function(event) {
            this.element
                .remove();
        }
    });
})(jQuery);