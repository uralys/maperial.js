
//=============================================================================================================================//
//ACCORDION
//========================================================================================================================//


StyleEditor.prototype.buildAccordion = function(){

   $("#accordion").remove();
   var accordion = $("<div class='accordion' id='accordion'></div>");
   accordion.appendTo(this.accordionPanel);

   var categoryNum = 0;

   for ( var categoryName in this.categories ){ // for all groups of element
      
      //--------------------------------------------------------------------//

      var category = this.categories[categoryName]

      //--------------------------------------------------------------------//

      $("<p class='accordionCategoryTitle' id='accordionCategoryTitle" + categoryNum + "'>"  + categoryName + "</p>").appendTo(accordion);
      var accordionCategory = $("<div class='accordionCategory' id='accordionCategory" + categoryNum +  "'></div>");
      accordionCategory.appendTo(accordion);

      //--------------------------------------------------------------------//

      var groupNum = 0;
      for ( var i = 0; i < category.length; i++ ){ 
         
         //--------------------------------------------------------------------//

         var group = category[i]
         
         //--------------------------------------------------------------------//
         
         var groupTitle = $('<p class="accordionGroupTitle rounded" id="accordionGroupTitle_' + group.id + '">' + group.surname + "</p>");
         accordionCategory.append(groupTitle);
         groupTitle.bind('click', this.selectGroup(group));
         
         
         var groupContent = $("<div class='accordionGroup' id='accordionGroup_" + group.id + "'></div>");
         groupContent.appendTo(accordionCategory);

         //--------------------------------------------------------------------//

         console.log(group)
         
         for ( var e = 0; e < group.elements.length; e++ ){   
            
            var element          = group.elements[e]
            element.uid          = this.getUID(element)
            element.categoryNum  = categoryNum
            element.groupNum     = groupNum
            
            if(!element.uid)
               continue // not in this specific style

            this.registerElement(element, groupContent)
         }

         groupNum++;
      } 
      
      categoryNum++;
   }


   // configure accordion(s)
   $( ".accordion" )
   .accordion({
      heightStyle: "content",
      collapsible: true,
      active: false
   })

   $( ".accordionCategory" )
   .accordion({
      heightStyle: "content",
      collapsible: false,
      active: false
   })

   this.styleEditorParentEl.show();   //show me !
}


//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.registerElement = function(element, container){
   
   //-------------------------------------//
   
   var uid = this.getUID(element)
   this.accordionElements[uid] = element

   //-------------------------------------//

   // bind onclick header event!
   var html = "<div id='accordionElement_"+uid+"' class='row-fluid accordionElement rounded'><p class='accordionElementName'>"+element.surname+"</p></div"
   container.append(html)
   $("#accordionElement_"+uid).bind('click', this.openWidgetFromAccordion(uid));
}

//----------------------------------------------------------------------------------------------------------------------//

StyleEditor.prototype.refreshAccordion = function(){
   
   var categoryNum   = this.accordionElements[this.currentLayerId].categoryNum;
   var groupNum      = this.accordionElements[this.currentLayerId].groupNum;
   
   $("#accordion").accordion("option", "active", categoryNum);
   $("#accordionCategory" + categoryNum).accordion("option", "active", groupNum);
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.selectGroup = function(group){
   var me = this
   return function() {
      console.log("select", group)
      
      me.unselectElements()
      
      if(me.selectedGroup)$("#accordionGroupTitle_" + me.selectedGroup.id).removeClass("selected")
      me.selectedGroup = group
      $("#accordionGroupTitle_" + me.selectedGroup.id).addClass("selected")
      
      for ( var e = 0; e < group.elements.length; e++ ){    
         var element = group.elements[e]
         me.selectElement(element.uid)
      }
      
      me.size = StyleEditor.SIMPLE
      me.currentLayerId = group.elements[0].uid
      me.refreshZoomAndWidget();
   }
}
   
//--------------------------------------------------------------------------//

StyleEditor.prototype.selectElement = function(uid){
   var accordionElement = $("#accordionElement_"+uid)
   accordionElement.addClass("selected")
   this.selectedElements.push(uid)
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.unselectGroup = function(){
   if(this.selectedGroup){
      $("#accordionGroupTitle_" + this.selectedGroup.id).removeClass("selected")
      this.selectedGroup = null
   }
}

//--------------------------------------------------------------------------//

StyleEditor.prototype.unselectElements = function(){

   for ( var i = 0; i < this.selectedElements.length; i++ ){
      var accordionElement = $("#accordionElement_"+this.selectedElements[i])
      accordionElement.removeClass("selected")
   }
   
   this.selectedElements = []
}
