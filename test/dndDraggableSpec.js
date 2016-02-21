describe('dndDraggable', function() {

  var SIMPLE_HTML = '<div dnd-draggable="{hello: \'world\'}"></div>';

  describe('constructor', function() {
    it('sets the draggable attribute', function() {
      var element = compileAndLink(SIMPLE_HTML);
      expect(element.attr('draggable')).toBe('true');
    });

    it('watches and handles the dnd-disabled-if expression', function() {
      var element = compileAndLink('<div dnd-draggable dnd-disable-if="disabled"></div>');
      expect(element.attr('draggable')).toBe('true');

      element.scope().disabled = true;
      element.scope().$digest();
      expect(element.attr('draggable')).toBe('false');

      element.scope().disabled = false;
      element.scope().$digest();
      expect(element.attr('draggable')).toBe('true');
    });
  });

  describe('dragstart handler', function() {
    var element;

    beforeEach(function() {
      element = compileAndLink(SIMPLE_HTML);
    });

    it('calls setData with serialized data', function() {
      expect(Dragstart.on(element).data).toEqual({'Text': '{"hello":"world"}'});
    });

    it('stops propagation', function() {
      expect(Dragstart.on(element).propagationStopped).toBe(true);
    });

    it('sets effectAllowed to move by default', function() {
      expect(Dragstart.on(element).effectAllowed).toBe('move');
    });

    it('sets effectAllowed from dnd-effect-allowed', function() {
      element = compileAndLink('<div dnd-draggable dnd-effect-allowed="copyMove"></div>');
      expect(Dragstart.on(element).effectAllowed).toBe('copyMove');
    });

    it('adds CSS classes to element', inject(function($timeout) {
      Dragstart.on(element);
      expect(element.hasClass('dndDragging')).toBe(true);
      expect(element.hasClass('dndDraggingSource')).toBe(false);

      $timeout.flush(0);
      expect(element.hasClass('dndDraggingSource')).toBe(true);
    }));

    it('invokes dnd-dragstart callback', function() {
      element = compileAndLink('<div dnd-draggable dnd-dragstart="ev = event"></div>');
      Dragstart.on(element);
      expect(element.scope().ev).toEqual(jasmine.any(DragEventMock));
    });

    it('does not start dragging if dnd-disable-if is true', function() {
      element = compileAndLink('<div dnd-draggable dnd-disable-if="true"></div>');
      var dragstart = Dragstart.on(element);
      expect(dragstart.returnValue).toBe(true);
      expect(dragstart.defaultPrevented).toBe(false);
      expect(dragstart.propagationStopped).toBe(false);
    });

    it('sets the dragImage if event was triggered on a dnd-handle', function() {
      var dragstart = Dragstart.on(element, {allowSetDragImage: true, dndHandle: true});
      expect(dragstart.dragImage).toBe(element[0]);
    });
  });

  describe('dragend handler', function() {
    var element, event;

    beforeEach(function() {
      element = compileAndLink(SIMPLE_HTML);
      event = createEvent('dragend');
    });

    it('stops propagation', function() {
      event._triggerOn(element);
      expect(event._propagationStopped).toBe(true);
    });

    it('removes CSS classes from element', inject(function($timeout) {
      element.addClass('dndDragging');
      element.addClass('dndDraggingSource');
      event._triggerOn(element);

      expect(element.hasClass('dndDragging')).toBe(false);
      expect(element.hasClass('dndDraggingSource')).toBe(true);

      $timeout.flush(0);
      expect(element.hasClass('dndDraggingSource')).toBe(false);
    }));

    var dropEffects = {move: 'moved', copy: 'copied', none: 'canceled'};
    angular.forEach(dropEffects, function(callback, dropEffect) {
      it('calls callbacks for dropEffect ' + dropEffect, function() {
        var html = '<div dnd-draggable dnd-dragend="de = dropEffect" '
                 + 'dnd-' + callback + '="ev = event"></div>';
        element = compileAndLink(html);

        // Simulate dragstart and drop to initialize internal state.
        createEvent('dragstart')._triggerOn(element);
        if (dropEffect != 'none') {
          var dropEvent = createEvent('drop');
          dropEvent._dt.dropEffect = dropEffect
          dropEvent._triggerOn(compileAndLink('<div dnd-list="[]"></div>'));
        }

        // Verify dragend event.
        event._triggerOn(element);
        expect(element.scope().ev).toBe(event.originalEvent);
        expect(element.scope().de).toBe(dropEffect);
      });
    });
  });

  describe('click handler', function() {
    it('does nothing if dnd-selected is not set', function() {
      var element = compileAndLink(SIMPLE_HTML);
      var click = new DragEventResult(element, 'click',  new DataTransferMock(), {});
      expect(click.propagationStopped).toBe(false);
    });

    it('invokes dnd-selected callback and stops propagation', function() {
      var element = compileAndLink('<div dnd-draggable dnd-selected="selected = true"></div>');
      var click = new DragEventResult(element, 'click',  new DataTransferMock(), {});
      expect(click.propagationStopped).toBe(true);
      expect(element.scope().selected).toBe(true);
    });
  });
});
