/*
  Module is responsible for general wrapper
*/
"use strict";
var mnv_ukelmap = mnv_ukelmap || {};

// DROPDOWNS constructor
mnv_ukelmap.dropdowns = (function(){
  var my, model, controller;
  my = {};
  controller = mnv_ukelmap.controller;
  model = mnv_ukelmap.model;

  // LOCAL FLAGS
  my.localflags = {
  };
  // LOCAL FLAGS ends

  // *** UMBERTO'S DROPDOWNS

  // CREATE TABS
  // Called from the INIT function.
  // Passed the tab definition and the DOM container; and an index identifying type (topics, zoom...)
  function createTabs (tabs, appendTo, eventListener) {
    // Build tabs and sub-menus.
    function createLevel(tabs, className, selected){
      var tabsTree = '<ul class="' + ((className) ? "ec-interactive-dropdowns" : "") +'">', tabsTreeChild, s = '', childClass, tabLength = 0;
      for (s in tabs) {
        tabsTreeChild = '';
        if (tabs.hasOwnProperty(s)) {
          if (!mnv_ukelmap.utilities.isEmptyObject(tabs[s].children)) {
            childClass = 'has-child';
            // Recursion
            tabsTreeChild = createLevel(tabs[s].children);
          } else {
            childClass = 'has-nochild';
          }
          // Default selected:
          if ((selected!==undefined && tabLength === selected) || (selected===undefined && tabLength === 0)) {
            childClass += ' selected';
          }
          tabsTree +=  '<li class="' + childClass + '"><span>' + tabs[s].label + '</span>' + tabsTreeChild + '</li>';
        }
        tabLength ++;
      }
      tabsTree += '</ul>';
      return tabsTree;
    }
    appendTo.append(createLevel(tabs, "ec-interactive-dropdowns", model.flags.topic_index));
    interactiveDropdowns(eventListener);
  }


  // INTERACTIVE DROPDOWNS
  // Called from createTabs. Param is the name of the callback function
  function interactiveDropdowns(callFunction) {
    var $this, $thisElm, cssTransitions, dropdownsMenu, showDropdowns;
    // Css transitions support. This relys on the Modernizr library.
    cssTransitions = $('.csstransitions').length;
    dropdownsMenu = $('.ec-interactive-dropdowns');

    showDropdowns = function () {
      $this = $(this);
      if (cssTransitions) {
        //$('.show-menu', dropdownsMenu).removeClass('show-menu');
        $this.addClass('show-menu');
      }
      else {
        // Show its submenu.
        $('ul', $this).css('display', 'block');
      }
    };

    // Set events on menu drop-downs.
    // Mouse over/out on topic menu tabs and zoom button shows/hides dropdowns.
    if (mnv_ukelmap.utilities.isTouchDevice()) {
      $('li.has-child', dropdownsMenu).click(showDropdowns);
    } else {
      $('li.has-child', dropdownsMenu).mouseenter(showDropdowns);
      $('li.has-child', dropdownsMenu).mouseleave(
      function () {
        $this = $(this);
        if (cssTransitions) {
          $this.removeClass('show-menu');
        }
        else {
          // Hide its submenu.
          $('ul', $this).css('display', 'none');
        }
      });
    }

    // Click on dropdown hides it.
    $('li:not(.has-child)', dropdownsMenu).click(function () {
      var $this, parent, getParentIndex;
      $this = $(this);
      parent = $this.parents('.ec-interactive-dropdowns');
      getParentIndex = $('.ec-interactive-dropdowns li:not(".has-child")').index(this);
      hideMenu($('li', dropdownsMenu));
      $('li, li.has-nochild', parent).removeClass('selected');
      $thisElm = ($this.hasClass('has-nochild')) ?  $this : $this.parents('li');
      $thisElm.addClass('selected');
      if(callFunction !== undefined) {
        callFunction(getParentIndex);
      }
    });

    // The menu gets hid.
    function hideMenu(menu) {
      if (!cssTransitions) {
        // Jquery.
        $('ul', menu).slideUp(10);
      }
      else {
        // CSS3 transitions.
        menu.removeClass('show-menu');
      }
    }
  }

  // *** UMBERTO'S DROPDOWNS END

  // INIT
  my.init = function() {
    var tabs, topicdiv;
    tabs = model.tabs;
    topicdiv = $(".ukelmap-topic-div");
    createTabs(tabs,topicdiv,controller.dropdownListener);
  };
  // INIT ends

  // UPDATE
  my.update = function() {
    var tabs, topicdiv, timeStamp, liveTime;
    console.log('Update dropdown...');

    // To prevent unnecessary redraws, what's current situation?
    // Crude check on first id:
    var currentID = model.tabs[0].id;
    // Go-live time check
    // UTC time now:
    timeStamp =  Date.now();
    // 'Go-live' time:
    var liveTime = model.goliveTime;
    // If it's after 'go-live' time, redirect model.tabs to livetab definitions
    if (timeStamp > liveTime) {
      model.tabs = model.livetabs;
      // Prevent any further update...
      model.startchecks.big.dropdowns.update = false;
    }
    // Redraw the tab-bar (emptying its parent first)
    tabs = model.tabs;
    // So have things changed?
    if (tabs[0].id !== currentID) {
      console.log(`ID changed from ${currentID} to ${tabs[0].id}`);
      topicdiv = $(".ukelmap-topic-div");
      topicdiv.empty();
      createTabs(tabs,topicdiv,controller.dropdownListener);
      // And force update to new tab's data...
      controller.dropdownListener(0);
    }
  };
  // UPDATE ends

  return my;
}());
// DROPDOWNS constructor ends


/*
 * These are just the constituent elements of an inline tab-assembly process.
 * Two objects are hard-defined here as variables to be passed to the function createTabs
 *    var tabs should be the tab-definition in the model
 *    var appendTo should be the DOM object to which the tab is appended
 *
 * function createTabs should be called from the INIT function, and passed the two above objects
 *
 * So to get this working, I need to call createTabs from my INIT function, passing in the tabs definition
 * on the model, and the DOM container
 * I also need to add, somewhere, code to set the width%, based on the number of tabls
 * *** And tweak to distinguish between topic-tabs, zoom and any other tab structure (like currencies on Big Mac) ***
 */


/*
// APPEND_TO
// This stands in for a reference to the container on the DOM
var demo_appendTo = $('#ec-article-body');
// APPEND_TO ends
*/
