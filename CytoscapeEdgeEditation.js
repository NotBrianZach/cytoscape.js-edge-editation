(function (scope) {
  const Class = function (param1, param2) {
    let extend,
      mixins,
      definition;
    if (param2) {     // two parameters passed, first is extends, second definition object
      extend = Array.isArray(param1) ? param1[0] : param1;
      mixins = Array.isArray(param1) ? param1.slice(1) : null;
      definition = param2;
    } else {      // only one parameter passed => no extend, only definition
      extend = null;
      definition = param1;
    }


    const Definition = definition.hasOwnProperty('constructor') ? definition.constructor : function () {};

    Definition.prototype = Object.create(extend ? extend.prototype : null);
    const propertiesObject = definition.propertiesObject ? definition.propertiesObject : {};
    if (mixins) {
      var i,
        i2;
      for (i in mixins) {
        for (i2 in mixins[i].prototype) {
          Definition.prototype[i2] = mixins[i].prototype[i2];
        }
        for (var i2 in mixins[i].prototype.propertiesObject) {
          propertiesObject[i2] = mixins[i].prototype.propertiesObject[i2];
        }
      }
    }

    Definition.prototype.propertiesObject = propertiesObject;

    Object.defineProperties(Definition.prototype, propertiesObject);

    for (const key in definition) {
      if (definition.hasOwnProperty(key)) {
        Definition.prototype[key] = definition[key];
      }
    }

    Definition.prototype.constructor = Definition;

    return Definition;
  };


  const Interface = function (properties) {
    this.properties = properties;
  };

  const InterfaceException = function (message) {
    this.name = 'InterfaceException';
    this.message = message || '';
  };

  InterfaceException.prototype = new Error();

  Interface.prototype.implements = function (target) {
    for (const i in this.properties) {
      if (target[this.properties[i]] == undefined) {
        throw new InterfaceException(`Missing property ${this.properties[i]}`);
      }
    }
    return true;
  };

  Interface.prototype.doesImplement = function (target) {
    for (const i in this.properties) {
      if (target[this.properties[i]] === undefined) {
        return false;
      }
    }
    return true;
  };

  const VectorMath = {
    distance(vector1, vector2) {
      return Math.sqrt(Math.pow(vector1.x - vector2.x, 2) + Math.pow(vector1.y - vector2.y, 2));
    },
  };

  const EventDispatcher = Class({
    constructor() {
      this.events = {};
    },
    on(name, listener, context) {
      this.events[name] = this.events[name] ? this.events[name] : [];
      this.events[name].push({
        listener,
        context,
      })
    },
    once(name, listener, context) {
      this.off(name, listener, context);
      this.on(name, listener, context);
    },
    off(name, listener, context) {
            // no event with this name registered? => finish
      if (!this.events[name]) {
        return;
      }
      if (listener) {		// searching only for certains listeners
        for (const i in this.events[name]) {
          if (this.events[name][i].listener === listener) {
            if (!context || this.events[name][i].context === context) {
              this.events[name].splice(i, 1);
            }
          }
        }
      } else {
        delete this.events[name];
      }
    },
    trigger(name) {
      const listeners = this.events[name];

      for (const i in listeners) {
        listeners[i].listener.apply(listeners[i].context, Array.prototype.slice.call(arguments, 1));
      }
    },
  });

  scope.CytoscapeEdgeEditation = Class({

    init(cy) {
      this.DOUBLE_CLICK_INTERVAL = 300;
      this.HANDLE_SIZE = 5;
      this.ARROW_END_ID = 'ARROW_END_ID';

      this._handles = {};
      this._dragging = false;
      this._hover = null;


      this._cy = cy;
      this._container = cy.container();
      console.log('this._cy CytoscapeEdgeEditation');
      console.log(this._cy);
            // this._$container = $(cy.container());

      this._cy.on('mouseover tap', 'node', this._mouseOver.bind(this));
      this._cy.on('mouseout', 'node', this._mouseOut.bind(this));


      this._container.addEventListener('mouseout', () => {
        this._clear();
      });
        // this._$container.addEventListener('mouseout', function(e){
        //   this._clear();
        // }.bind(this));

      this._container.addEventListener('mouseover', () => {
        if (this._hover) {
          this._mouseOver({ cyTarget: this._hover });
        }
      });
      // this._$container.on('mouseover', function (e) {
      //   if (this._hover) {
      //     this._mouseOver({ cyTarget: this._hover });
      //   }
      // }.bind(this));

      // this._cy.addEventListener('select', this._redraw.bind(this))
      // this._cy.addEventListener('node', this._redraw.bind(this))
      this._cy.on('select', 'node', this._redraw.bind(this))

      // this._cy.addEventListener('node', () => {
      //   this._nodeClicked = true;
      // })
      // this._cy.addEventListener('mousedown', () => {
      //   this._nodeClicked = true;
      // })
      this._cy.on('mousedown', 'node', () => {
        this._nodeClicked = true;
      });

      // this._cy.addEventListener('node', () => {
      //   this._nodeClicked = true;
      // })
      // this._cy.addEventListener('mouseup', () => {
      //   this._nodeClicked = true;
      // })
      this._cy.on('mouseup', 'node', () => {
        this._nodeClicked = false;
      });

      this._cy.on('remove', 'node', () => {
        this._hover = false;
        this._clear();
      })

      this._cy.bind('zoom pan', this._redraw.bind(this));


      this._canvas = document.createElement('canvas') // '<canvas></canvas>';

      this._canvas.style.top = 0;

      this._canvas.addEventListener('mousedown', this._mouseDown.bind(this));
      this._canvas.addEventListener('mousemove', this._mouseMove.bind(this));
            // this._$canvas = $('<canvas></canvas>');
            // this._$canvas.css("top", 0);
            // this._$canvas.on("mousedown", this._mouseDown.bind(this));
            // this._$canvas.on("mousemove", this._mouseMove.bind(this));

      this._ctx = this._canvas.getContext('2d');
      console.log('this._ctx')
      console.log(this._ctx)
      // console.log('this._container.children')
      // console.log(this._container.children)
      this._container.children[0].appendChild(this._canvas);
      // this._$container.children("div").append(this._$canvas);

      console.log('document.getElementById(window)', window)
      console.log(window)

      // window.bind('mouseup', this._mouseUp.bind(this));
      // $(window).bind('mouseup', this._mouseUp.bind(this));

            // $(window).bind('resize', this._resizeCanvas.bind(this));

      // this._container.addEventListener('mouseover', function (e) {
      //   if (this._hover) {
      //     this._mouseOver({ cyTarget: this._hover });
      //   }
      // }.bind(this));
      window.addEventListener('resize', this._resizeCanvas.bind(this));

      console.log('this._cy in init')
      console.log(this._cy)
      this._cy.on('resize', this._resizeCanvas.bind(this));

      this._container.addEventListener('resize', this._resizeCanvas.bind(this));
      // this._container.bind('resize', function () {
      //   this._resizeCanvas();
      // }.bind(this));

      this._resizeCanvas();

      this._arrowEnd = this._cy.add({
        group: 'nodes',
        data: {
          id: this.ARROW_END_ID,
          position: { x: 150, y: 150 },
        },
      });

      this._arrowEnd.style.opacity = '0'
      this._arrowEnd.style.width = '0.0001'
      this._arrowEnd.style.height = '0.0001'
      // this._arrowEnd.css({
      //   opacity: 0,
      //   width: 0.0001,
      //   height: 0.0001,
      // });
    },
    registerHandle(handle) {
      if (handle.nodeTypeNames) {
        handle.nodeTypeNames.map((i) => {
          const nodeTypeName = handle.nodeTypeNames[i];
          this._handles[nodeTypeName] = this._handles[nodeTypeName] || [];
          this._handles[nodeTypeName].push(handle);
          return undefined
        })
      } else {
        this._handles['*'] = this._handles['*'] || [];
        this._handles['*'].push(handle);
      }
    },
    _showHandles(target) {
      const nodeTypeName = target.data.type;
      console.log('_showHandles, target')
      console.log(target)
      if (nodeTypeName) {
        const handles = this._handles[nodeTypeName] ? this._handles[nodeTypeName] : this._handles['*'];
        handles.map((i) => {
          if (handles[i].type != null) {
            this._drawHandle(handles[i], target);
          }
          return undefined
        })
      }
    },
    _clear() {
      const w = this._container.width;
      const h = this._container.height;
      this._ctx.clearRect(0, 0, w, h);
    },
    _drawHandle(handle, target) {
      console.log('drawHandle')
      const position = this._getHandlePosition(handle, target);

      this._ctx.beginPath();
      this._ctx.arc(position.x, position.y, this.HANDLE_SIZE, 0, 2 * Math.PI, false);
      this._ctx.fillStyle = handle.color;
      this._ctx.strokeStyle = 'white';
      this._ctx.lineWidth = 2;
      this._ctx.fill();
      this._ctx.stroke();
    },
    _drawArrow(fromNode, toPosition, handle) {
      let toNode;
      if (this._hover) {
        toNode = this._hover;
      } else {
        this._arrowEnd.renderedPosition(toPosition);
        toNode = this._arrowEnd;
      }


      if (this._edge) {
        this._edge.remove();
      }

      this._edge = this._cy.add({
        group: 'edges',
        data: {
          id: 'edge',
          source: fromNode.id(),
          target: toNode.id(),
        },
        css: Object.assign(this._getEdgeCSSByHandle(handle), { opacity: 0.5 }),
      });
    },
    _clearArrow() {
      if (this._edge) {
        this._edge.remove();
        this._edge = null;
      }
    },
    _resizeCanvas() {
      // this._canvas.style.top = 0;
      this._canvas.style.height = this._container.height
      this._canvas.style.width = this._container.width
      this._canvas.style.position = 'absolute'
      this._canvas.style['z-index'] = '999'
      // this._canvas
      //           .attr('height', this._container.height)
      //           .attr('width', this._container.width)
      //           .css({
      //             'position': 'absolute',
      //             'z-index': '999',
      //           });
    },
    _mouseDown(e) {
      this._hit = this._hitTestHandles(e);

      if (this._hit) {
        this._lastClick = Date.now();
        this._dragging = this._hover;
        this._hover = null;
        e.stopImmediatePropagation();
      }
    },
    _mouseUp() {
      if (this._hover) {
        if (this._hit) {
          const edgeToRemove = this._checkSingleEdge(this._hit.handle, this._dragging);
          if (edgeToRemove) {
            this._cy.remove(`#${edgeToRemove.id()}`);
          }
          const edge = this._cy.add({
            data: {
              source: this._dragging.id(),
              target: this._hover.id(),
              type: this._hit.handle.type,
            },
          });
          this._initEdgeEvents(edge);
        }
      }
      this._dragging = false;
      this._clearArrow();
    },
    _mouseMove(e) {
      if (this._hover) {
        const hit = this._hitTestHandles(e);
        if (hit) {
          document.getElementsByTagName('body')[0].style.cursor = 'pointer'
                  // $("body").css("cursor", "pointer");
        } else {
          document.getElementsByTagName('body')[0].style.cursor = 'pointer'
                  // $("body").css("cursor", "inherit");
        }
      } else {
        document.getElementsByTagName('body')[0].style.cursor = 'pointer'
              // $("body").css("cursor", "inherit");
      }

      if (this._dragging && this._hit.handle) {
        this._drawArrow(this._dragging, this._getRelativePosition(e), this._hit.handle);
      }

      if (this._nodeClicked) {
        this._clear();
      }
    },
    _mouseOver(e) {
      if (this._dragging) {
        console.log('dragging in mouseover')
        console.log(e)
        if (typeof e.cyTarget !== 'undefined' && (e.cyTarget._private.data.id !== this._dragging.id() || this._hit.handle.allowLoop)) {
          this._hover = e.target;
        }
      } else {
        // console.log(this._hover.data)
        console.log('_mouseOver')
        console.log(e)
        if (typeof e.cyTarget !== 'undefined') {
          console.log('_mouseOver')
          console.log(e)
          this._hover = e.cyTarget;
          this._showHandles(this._hover);
        }
        // if it's not a cyTarget, might not make sense
        // else {
        //   this._hover = e.target._private;
        //   this._showHandles(this._hover);
        // }
      }
    },
    _mouseOut() {
      this._clear();
      this._hover = null;
    },
    _removeEdge(edge) {
      edge.off('mousedown');
      this._cy.remove(`#${edge.id()}`);
    },
    _initEdgeEvents(edge) {
      const self = this;
      edge.on('mousedown', function () {
        if (self.__lastClick && Date.now() - self.__lastClick < self.DOUBLE_CLICK_INTERVAL) {
          self._removeEdge(this);
        }
        self.__lastClick = Date.now();
      })
    },
    _hitTestHandles(e) {
      const mousePosition = this._getRelativePosition(e);

      if (this._hover) {
        const nodeTypeName = this._hover.data.type;
        if (nodeTypeName) {
          const handles = this._handles[nodeTypeName] ? this._handles[nodeTypeName] : this._handles['*'];

          for (const i in handles) {
            const handle = handles[i];

            const position = this._getHandlePosition(handle, this._hover);
            if (VectorMath.distance(position, mousePosition) < this.HANDLE_SIZE) {
              return {
                handle,
                position,
              };
            }
          }
        }
      }
    },
    _getHandlePosition(handle, target) {
      const position = target.position;
      const width = target.autoWidth;
      const height = target.autoHeight;
      let xpos = null;
      let ypos = null;

      switch (handle.positionX) {
        case 'left':
          xpos = position.x - width / 2 + this.HANDLE_SIZE;
          break;
        case 'right':
          xpos = position.x + width / 2 - this.HANDLE_SIZE;
          break;
        case 'center':
          xpos = position.x;
          break;
        default: break
      }

      switch (handle.positionY) {
        case 'top':
          ypos = position.y - height / 2 + this.HANDLE_SIZE;
          break;
        case 'center':
          ypos = position.y;
          break;
        case 'bottom':
          ypos = position.y + height / 2 - this.HANDLE_SIZE;
          break;
        default: break
      }

      return { x: xpos, y: ypos };
    },
    _getEdgeCSSByHandle(handle) {
      const color = handle.lineColor ? handle.lineColor : handle.color;
      return {
        'line-color': color,
        'target-arrow-color': color,
      };
    },
    _getHandleByType(type) {
      for (const i in this._handles) {
        const byNodeType = this._handles[i];
        for (const i2 in byNodeType) {
          const handle = byNodeType[i2];
          if (handle.type === type) {
            return handle;
          }
        }
      }
    },
    _getRelativePosition(e) {
      const rect = this._container.getBoundingClientRect();
      return {
        x: e.pageX - (rect.left + document.body.scrollLeft),
        y: e.pageY - (rect.top + document.body.scrollTop),
      }
      // var containerPosition = this._$container.offset();
      // return {
      //   x: e.pageX - containerPosition.left,
      //   y: e.pageY - containerPosition.top,
      // }
    },
    _checkSingleEdge(handle, node) {
      if (handle.noMultigraph) {
        const edges = this._cy.edges(`[source='${this._hover.id()}'][target='${node.id()}'],
           [source='${node.id()}'][target='${this._hover.id()}']`);

        for (let i = 0; i < edges.length; i += 1) {
          return edges[i];
        }
      } else {
        if (handle.single === false) {
          return;
        }
        const edges = this._cy.edges(`[source='${node.id()}']`);

        for (let i = 0; i < edges.length; i++) {
          if (edges[i].data().type === handle.type) {
            return edges[i];
          }
        }
      }
    },
    _redraw() {
      this._clear();
      if (this._hover) {
        this._showHandles(this._hover);
      }
    },
  });
}(this));
