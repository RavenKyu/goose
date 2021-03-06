Object.size = function(obj) {
    var size = 0, key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) size++;
    }
    return size;
};

/* Util Class */
function Util()
{
	// remove <br>
	this.removeBR = function (element)
	{
		element.find('br').replaceWith(' ');
	}

	// string limiter
	this.stringLimiter = function(element, limit)
	{
		var str = element.text();
		if (str.length > limit)
		{
			element.text(str.substring(0, limit));
		}
	}

	// remove space
	this.removeSpace = function(element)
	{
		element.text(element.text().replace(/\s+/g, ''));
	}
}


/* Index Event Class */
function IndexEvent(get)
{
	var
		_index = this,
		_context = get._context,
		index = get.index,
		context = get.context,
		root = index.children().children('li[loc=root]'),
		_util = new Util()
	;

	// send self object to Context
	_context.getIndex(this);


	/* Functions */
	// select buttons
	function selectButtons(li)
	{
		return li.children('dl').children('dt').children('button');
	}

	// update count
	function updateCount(li)
	{
		var itemCount = li.find('> ul > li').length;
		li.find('> dl em.count').text(itemCount);
	}

	// update number
	function updateNumber($lis)
	{
		$lis.each(function(k){
			$(this).find('> dl > dt > em.no').text(k);
		});
	}

	// input checker
	function inputCheckEvent(item)
	{
		var $strong = item.find('> dl > dt > strong');
		$strong.on('blur', function(){
			_util.removeBR($(this));
			_util.removeSpace($(this));
			_util.stringLimiter($(this), 20);
		});
	}

	// button event
	function buttonsEvent(buttons)
	{
		var $item = buttons.closest('li');

		// control
		buttons.filter('[role=control]').on('click', function(e){
			e.stopPropagation();
			_context.off($item);
			_context.on($item, $(this));
		});

		// toggle
		buttons.filter('[role=toggle]').on('click', function(){
			$item.toggleClass('on')
		});
	}


	/* Methods */
	// insert item
	this.insertItem = function(opt)
	{
		var
			textAttr = {'contenteditable' : true, 'spellcheck' : false}
			,$ul = opt.active.children('ul')
			,itemNumber = $ul.children('li').length
			,$item = $('<li/>')
				.attr('type', opt.type)
				.addClass('on')
				.append(
					$('<dl/>')
						.append(
							$('<dt/>')
								.append(
									$('<button/>')
										.attr({'type' : 'button', 'role' : 'move'})
										.text('move')
								)
								.append(
									$('<button/>')
										.attr({'type' : 'button', 'role' : 'control'})
										.text('control')
								)
								.append(
									$('<em/>').addClass('no').text(itemNumber)
								)
								.append(
									$('<button/>')
										.attr({'type' : 'button', 'role' : 'toggle'})
										.text('toggle')
								)
								.append(
									$('<strong/>')
										.attr(textAttr)
										.attr('data-ph', opt.type)
								)
								.append(
									$('<span/>')
										.addClass('type')
								)
								.append(
									$('<em/>').addClass('count').text('0')
								)
						)
						.append(
							$('<dd/>')
								.append(
									$('<span/>')
										.attr(textAttr)
								)
						)
				)
				.append($('<ul/>'))
		;

		// push data
		if (opt.data)
		{
			$item.find('dt strong').text(opt.data.key);
			$item.find('dd span').text(opt.data.value);
		}

		buttonsEvent(selectButtons($item));
		inputCheckEvent($item);

		opt.active
			.addClass('on')
			.children('ul').append($item)
		;
		updateCount(opt.active);

		if (opt.complete)
		{
			opt.complete($item);
		}
	}

	// type item
	this.typeItem = function(opt)
	{
		opt.active.attr('type', opt.type);
		opt.active.find('> dl > dt > strong').attr('data-ph', opt.type);
	}

	// duplicate item
	this.duplicateItem = function(target)
	{
		var $copy = target.clone().insertAfter(target).find('li').andSelf();
		$copy.each(function(){
			buttonsEvent(selectButtons($(this)));
			inputCheckEvent($(this));
		});
		updateCount(target.parent().parent());
		updateNumber(target.parent().children());
	}

	// remove item
	this.removeItem = function(target)
	{
		var $parentItem = target.parent().parent();
		target.remove();
		updateCount($parentItem);
	}

	// Import JSON
	this.importJSON = function(data, $li)
	{
		function items(getData, $item)
		{
			$.each(getData, function(index, value){
				var
					data = {key : index, value : value}
					,type = null
				;

				if (typeof value === 'string')
				{
					type = 'String';
				}
				else if (typeof value === 'object')
				{
					type = (Array.isArray(value)) ? 'Array' : 'Object';
				}

				_index.insertItem({
					active : $item,
					type : type,
					data : data,
					complete : function($item){
						if (type !== 'String' && Object.size(value) > 0)
						{
							items(value, $item);
						}
					}
				});
			});
		}

		items(data, $li);
	}

	// Export JSON
	this.exportJSON = function(space)
	{
		function items($li, obj)
		{
			var $lis = $li.children('ul').children('li');
			if ($lis.length)
			{
				$lis.each(function(){
					var
						$this = $(this)
						,key = $this.find('> dl > dt > strong').text()
						,value = $this.find('> dl > dd > span').text()
					;
					switch($(this).attr('type'))
					{
						case 'String':
							if ($li.attr('type') == 'Array')
							{
								obj.push(value);
							}
							else
							{
								obj[key] = value;
							}
							break;
						case 'Array':
							if ($li.attr('type') == 'Array')
							{
								obj.push(items($this, new Array()));
							}
							else
							{
								obj[key] = items($this, new Array());
							}
							break;
						case 'Object':
							if ($li.attr('type') == 'Array')
							{
								obj.push(items($this, new Object()));
							}
							else
							{
								obj[key] = items($this, new Object());
							}
							break;
					}
				});
			}
			return obj;
		}

		var json = items(
			root
			,(root.attr('type') == 'Array') ? new Array() : new Object()
		);
		return JSON.stringify(json, null, (space) ? space : 0);
	}

	// Init
	buttonsEvent(selectButtons(root));

	// drag and drop event
	var adjustment, beforeItem;
	root.children('ul').sortable({
		itemSelector : 'li'
		,handle : 'button[role=move]'
		,group : 'index'
		,pullPlaceholder: true
		,onDrop : function(item, targetContainer, _super) {
			_super(item);

			updateCount(beforeItem.parent());
			updateCount(targetContainer.el.parent());

			updateNumber(beforeItem.children());
			updateNumber(targetContainer.el.children());

			beforeItem = adjustment = null;
		}
		,onDragStart : function($item, container, _super) {
			var
				offset = $item.offset()
				,pointer = container.rootGroup.pointer
			;
			adjustment = {
				left: pointer.left - offset.left
				,top: pointer.top - offset.top
			};
			beforeItem = container.el;
			_super($item, container)
		}
		,onDrag : function($item, position) {
			$item.css({
				left: position.left - adjustment.left
				,top: position.top - adjustment.top
			});
		}
		,isValidTarget : function ($item, container) {
			return (container.el.parent().attr('type') == 'String') ? false : true;
		}
	});
}


/* Context Event Class */
function ContextEvent(get)
{
	var
		_context = this,
		_index = null,
		wrap = $('html'),
		index = get.index
		context = get.context,
		active = null
	;

	/* Methods */
	// get index
	this.getIndex = function(obj)
	{
		_index = obj;
	}

	// on
	this.on = function(li, button)
	{
		active = li;
		context
			.attr('type', li.attr('type'))
			.css({
				left : button.position().left + button.outerWidth()
				,top : button.position().top - 3
			})
		;
		if (li.attr('loc') == 'root')
		{
			context.attr('loc', li.attr('loc'))
		}
		else
		{
			context.removeAttr('loc');
		}
		wrap.on('click', function(){
			_context.off();
		});
	}

	// off
	this.off = function(button)
	{
		active = null;
		context.removeAttr('type');
		wrap.off();
	}

	/* Context navigation */
	// items event
	context.find('li').on('click', function(e){
		e.stopPropagation();
	});

	context.find('li[role=Type] li').on('click', function(){
		_index.typeItem({
			active : active,
			type : $(this).attr('role')
		});
		_context.off();
	});

	context.find('li[role=Insert] li').on('click', function(){
		_index.insertItem({
			active : active,
			type : $(this).attr('role'),
			data : null
		});
		_context.off();
	});

	context.find('li[role=Duplicate]').on('click', function(){
		_index.duplicateItem(active);
		_context.off();
	});

	context.find('li[role=Remove]').on('click', function(){
		_index.removeItem(active);
		_context.off();
	});
}


;(function($){
	var
		$index = $('#jsonIndex')
		,$context = $('#context')
		,$root = $index.find('li[loc=root]')
		,context = new ContextEvent({
			context : $context
			,index : $index
		})
		,index = new IndexEvent({
			index : $index
			,context : $context
			,_context : context
		})
	;

	// import json
	try {
		var json = JSON.parse(jsonData);
	}
	catch(e) {
		var json = new Object();
	}

	if (Array.isArray(json))
	{
		index.typeItem({
			active : $root,
			type : 'Array'
		});
	}
	index.importJSON(json, $root);

	// submit form
	$('form[name=post]').on('submit', function(){
		var $this = $(this);
		$this.find('input[name=json]').val(index.exportJSON(0));
	});

	// export JSON
	$('button[role=btn_toJSON]').on('click', function(){
		$('#result').text(index.exportJSON(5));
	});
})(jQuery);
