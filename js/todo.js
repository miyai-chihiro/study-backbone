(function(window){

	var $ = window.jQuery,
		_ = window._,
		Backbone = window.Backbone;

	var Todo = Backbone.Model.extend({
		defaults: {
			done: false
		},
		initialize: function(){
			this.on('remove',function(){
				this.unset('order');
			}, this);
		},
		toggle: function(){
			this.save({
				done: !this.get('done')
			});
		}
	});

	var TodoList = Backbone.Collection.extend({
		model: Todo,
		localStorage: new Backbone.LocalStorage("todos"),
		comparator: 'order',

		// 完了しているTodoを返す
		done: function(){
			return this.where({done: true});
		}
	});

	var template = _.memoize(function(selector){
		return _.template($(selector).html());
	});

	var TodoView = Backbone.View.extend({
		
		tagName: 'li',

		events: {
			'click .toggle': 'toggleDone',
			'dblclick .view': 'edit',
			'click a.destroy': 'clear',
			'keypress .edit': 'updateOnEnter',
			'blur .edit': 'close',

			//ドラッグ・アンド・ドロップで並び替えられるようにする
			'dragstart': 'onDragStart',
			'dragend': 'onDragEnd',
			'drop': 'onDrop',
			'dragover': 'onDragOver'
		},

		template: function(data){
			return template('#item-template')(data);
		},
 
		initialize: function(){
			this.listenTo(this.model,'change',this.render);
			this.listenTo(this.model,'destroy',this.remove);
		},

		render: function(){
			this.$el.html(this.template(this.model.toJSON()));
			this.$el.toggleClass('done',this.model.get('done'));
			this.input = this.$('.edit');
			return this;
		},

		toggleDone: function(){
			this.model.toggle();
		},

		edit: function(){
			if(this.editing){
				return;
			}
			this.editing = true;
			this.$el.addClass('editing');
			this.input.focus();
		},

		close: function(){
			if(!this.editing){
				return;
			}
			this.editing = false;
			var value = this.input.val();
			if(!value){
				this.clear();
			} else {
				this.model.save({title: value});
				this.$el.removeClass('editing');
			}
		},

		updateOnEnter: function(e){
			if(!this.editing){
				return false;
			}
			if(e.keyCode == 13){
				this.close();
			}
		},

		clear: function(){
			this.model.destroy();
		},

		onDragStart: function(e){
			this.moving = true;
			this.$el.addClass('moving');
			e.originalEvent.dataTransfer.setData('application/x-todo-id', this.model.id);
		},

		onDrop: function(e) {
			e.preventDefault();
			//自分自身へドロップした場合は何もしない
			if(!this.moving) {
				var id, model, tmp;
				id = e.originalEvent.dataTransfer.getData('application/x-todo-id');
				//this.model.collection.swap(id, this.model.id);
			}
		},

		onDragEnd: function(){
			this.moving = false;
			this.$el.removeClass('moving');
		},

		onDragOver: function(e){
			//ドロップ可能にする
			e.preventDefault();
		}
	});

	var AppView = Backbone.View.extend({
		el: '#todoapp',

		template: function(data) {
			return template('#stats-template')(data);
		},

		events: {
			'keypress #new-todo': 'createOnEnter',
			'click #clear-completed': 'clearCompleted',
			'click #toggle-all': 'toggleAllComplete'
		},

		initialize: function(){
			//TodoListをローカルで持つことで TodoListのメソッドをthisで呼び出せる
			this.collection = new TodoList();
			this.input = this.$('#new-todo');
			this.allCheckbox = this.$('#toggle-all')[0];
			this.list = $('#todo-list');

			this.listenTo(this.collection,'add',this.addOne);
			//event に all を指定するとすべてのイベントが発生したときにコールバック関数が発生
			this.listenTo(this.collection,'all',this.render);
			this.listenTo(this.collection,'sort',this.render);

			this.main = $('#main');
			this.footer = $('footer');
			this.collection.fetch();
		},

		render: function(){
			var done = this.collection.done().length;
			if(this.collection.length){
				this.main.show();
				this.footer
					.show()
					.html(this.template({done: done}));
			} else {
				this.main.hide();
			}
		},

		//collection の callback の第1引数 には model
		addOne: function(todo){
			var view = new TodoView({model: todo});
			this.list.append(view.render().el);
		},

		createOnEnter: function(e){
			var value = this.input.val();

			if(e.keyCode !== 13){
				return;
			}
			if(!value){
				return;
			}
			this.collection.create({title: value});
			this.input.val("");
		},
		
		clearCompleted: function(e){
			_.invoke(this.collection.done(), 'destroy');
			return false;
		},

		toggleAllComplete: function(){
			var done = this.allCheckbox.checked;
			this.collection.each(function(todo){
				todo.save({ done: done });
			});
		}

	});

	$(function(){
		new AppView();
	});

})(window);

