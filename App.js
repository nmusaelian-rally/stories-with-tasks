Ext.define('CustomApp', {
    extend: 'Rally.app.TimeboxScopedApp',
    componentCls: 'app',
    scopeType: 'iteration',
    comboboxConfig: {
        fieldLabel: 'Select iteration:',
        labelWidth: 100,
        width: 300
    },

    addContent: function() {
        this._makeStore();
    },
    
    _makeStore: function(){
        console.log("make store");
         Ext.create('Rally.data.WsapiDataStore', {
            model: 'User Story',
            fetch: ['FormattedID','Name', 'Owner', 'ScheduleState', 'PlanEstimate', 'TaskEstimateTotal', 'TaskRemainingTotal', 'Tasks'],
            context: {
                context: this.getContext().getDataContext()
            },
            pageSize: 100,
            autoLoad: true,
            filters: [this.getContext().getTimeboxScope().getQueryFilter()],
            listeners: {
                load: this._onDataLoaded,
                scope: this
            }
        }); 
    },
    
   onScopeChange: function() {
        this._makeStore();
    },
    
    _onDataLoaded: function(store, data){
         console.log("on data loaded...");
                var stories = [];
                var pendingtasks = data.length;
                if (data.length ===0) {
                        this._createGrid(stories);  //to force refresh on grid when there are no stories in iteration
                }
                _.each(data, function(story) {
                            var s  = {
                                FormattedID: story.get('FormattedID'),
                                Name: story.get('Name'),
                                Owner:  (story.get('Owner') && story.get('Owner')._refObjectName) || 'None',
                                ScheduleState: story.get('ScheduleState'),
                                PlanEstimate: story.get('PlanEstimate'),
                                _ref: story.get("_ref"),
                                Tasks: [],
                                TaskEstimateTotal: story.get('TaskEstimateTotal'),
                                TaskRemainingTotal: story.get('TaskRemainingTotal')
                            };
                            
                        var tasks = story.getCollection('Tasks', {fetch: ['FormattedID','Owner','State','Estimate', 'ToDo']});
                           tasks.load({
                                callback: function(records, operation, success){
                                    _.each(records, function(task){
                                            s.Tasks.push({
                                            _ref: task.get('_ref'),
                                            FormattedID: task.get('FormattedID'),
                                            State: task.get('State'),
                                            Estimate: task.get('Estimate'),
                                            ToDo: task.get('ToDo'),
                                            Owner:  (task.get('Owner') && task.get('Owner')._refObjectName) || 'None'
                                                    });
                                    }, this);
                                    
                                    --pendingtasks;
                                    if (pendingtasks === 0) {
                                        this._createGrid(stories);
                                    }
                                },
                                scope: this
                            });
                            stories.push(s);
                }, this);
    },
    
    _createGrid: function(stories) {
         console.log("create grid");
        var store = Ext.create('Rally.data.custom.Store', {
                data: stories,
                pageSize: 100,
                remoteSort:false
            });
        
        if (!this.down('#sgrid')){
         this.add({
            xtype: 'rallygrid',
            itemId: 'sgrid',
            store: store,
            columnCfgs: [
                {
                   text: 'Formatted ID', dataIndex: 'FormattedID', xtype: 'templatecolumn',
                    tpl: Ext.create('Rally.ui.renderer.template.FormattedIDTemplate')
                },
                {
                    text: 'Name', dataIndex: 'Name'
                },
                {
                    text: 'Owner', dataIndex: 'Owner'
                },
                {
                    text: 'Plan Estimate', dataIndex: 'PlanEstimate'
                },
                {
                    text: 'ScheduleState', dataIndex: 'ScheduleState', xtype: 'templatecolumn',
                        tpl: Ext.create('Rally.ui.renderer.template.ScheduleStateTemplate',
                            {
                                states: ['Defined', 'In-Progress', 'Completed', 'Accepted'],
                                field: {
                                    name: 'ScheduleState' 
                                }
                        })
                },
                {
                    text: 'Task Estimate Total', dataIndex: 'TaskEstimateTotal'
                },
                {
                    text: 'Task Remaining Total', dataIndex: 'TaskRemainingTotal'
                },
                {
                    text: 'Tasks', dataIndex: 'Tasks', minWidth: 150,
                    renderer: function(value) {
                        var html = [];
                        _.each(value, function(task){
                            html.push('<a href="' + Rally.nav.Manager.getDetailUrl(task) + '">' + task.FormattedID + '</a>' + ' State: ' + task.State + ' Estimate:' + task.Estimate +  ' ToDo:' + task.ToDo);
                        });
                        return html.join('</br>');
                    }
                },
                {
                    text: 'Task Owner', dataIndex: 'Tasks', 
                    renderer: function(value) {
                        var html = [];
                        _.each(value, function(task){
                            html.push(task.Owner);
                        });
                        return html.join('</br></br>');
                    }
                }
            ]
            
        });
        }
        else{
            this.down('#sgrid').reconfigure(store);
        }
    }
       
});
