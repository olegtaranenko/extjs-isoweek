Ext.define('Insistent.ux.date.Picker', {
    extend: 'Ext.picker.Date',
    alias: 'widget.insistentdatepicker',

//    initHour: 12, // 24-hour format
    showToday: false,

    numDays: 48, //42 + 6, week no

    renderTpl: [
        '<div id="{id}-innerEl" data-ref="innerEl" role="presentation">',
        '<div class="{baseCls}-header">',
        '<div id="{id}-prevEl" data-ref="prevEl" class="{baseCls}-prev {baseCls}-arrow" role="presentation" title="{prevText}"></div>',
        '<div id="{id}-middleBtnEl" data-ref="middleBtnEl" class="{baseCls}-month" role="heading">{%this.renderMonthBtn(values, out)%}</div>',
        '<div id="{id}-nextEl" data-ref="nextEl" class="{baseCls}-next {baseCls}-arrow" role="presentation" title="{nextText}"></div>',
        '</div>',
        '<table role="grid" id="{id}-eventEl" data-ref="eventEl" class="{baseCls}-inner" cellspacing="0" tabindex="0">',
        '<thead>',
        '<tr role="row">',
        '<tpl for="dayNames">',
        '<th role="columnheader" class="{parent.baseCls}-column-header">',
        '<tpl if="xindex &gt; 1">',
        '<div role="presentation" class="{parent.baseCls}-column-header-inner">{.:this.firstInitial}</div>',
        '</tpl>',
        '</th>',
        '</tpl>',
        '</tr>',
        '</thead>',
        '<tbody>',
        '<tr role="row">',
        '<tpl for="days">',
        '{#:this.isEndOfWeek}',
        '<td role="gridcell">',
        '<div hidefocus="on" class="{parent.baseCls}-date"></div>',
        '</td>',
        '</tpl>',
        '</tr>',
        '</tbody>',
        '</table>',
        '<tpl if="showToday">',
        '<div id="{id}-footerEl" data-ref="footerEl" role="presentation" class="{baseCls}-footer">{%this.renderTodayBtn(values, out)%}</div>',
        '</tpl>',
        // These elements are used with Assistive Technologies such as screen readers
        '<div id="{id}-todayText" class="' + Ext.baseCSSPrefix + 'hidden-clip">{todayText}.</div>',
        '<div id="{id}-ariaMinText" class="' + Ext.baseCSSPrefix + 'hidden-clip">{ariaMinText}.</div>',
        '<div id="{id}-ariaMaxText" class="' + Ext.baseCSSPrefix + 'hidden-clip">{ariaMaxText}.</div>',
        '<div id="{id}-ariaDisabledDaysText" class="' + Ext.baseCSSPrefix + 'hidden-clip">{ariaDisabledDaysText}.</div>',
        '<div id="{id}-ariaDisabledDatesText" class="' + Ext.baseCSSPrefix + 'hidden-clip">{ariaDisabledDatesText}.</div>',
        '</div>',
        {
            firstInitial: function(value) {
                return Ext.picker.Date.prototype.getDayInitial(value);
            },
            isEndOfWeek: function(value) {
                // convert from 1 based index to 0 based
                // by decrementing value once.
                value--;
                var end = value % 8 === 0 && value !== 0;
                return end ? '</tr><tr role="row">' : '';
            },
            renderTodayBtn: function(values, out) {
                Ext.DomHelper.generateMarkup(values.$comp.todayBtn.getRenderTree(), out);
            },
            renderMonthBtn: function(values, out) {
                Ext.DomHelper.generateMarkup(values.$comp.monthBtn.getRenderTree(), out);
            }
        }
    ],

    initComponent: function() {
        var me = this,
            dayNames = Ext.clone(Ext.Date.dayNames);

        dayNames.unshift('SO'); // dirty hack
        me.dayNames = dayNames;

        me.callParent(arguments);
    },

    fullUpdate: function(date) {
        var me = this,
            cells = me.cells.elements,
            textNodes = me.textNodes,
            disabledCls = me.disabledCellCls,
            eDate = Ext.Date,
            itemIndex = 0,
            extraDays = 0,
            newDate = +eDate.clearTime(date, true),
            today = +eDate.clearTime(new Date()),
            min = me.minDate ? eDate.clearTime(me.minDate, true) : Number.NEGATIVE_INFINITY,
            max = me.maxDate ? eDate.clearTime(me.maxDate, true) : Number.POSITIVE_INFINITY,
            ddMatch = me.disabledDatesRE,
            ddText = me.disabledDatesText,
            ddays = me.disabledDays ? me.disabledDays.join('') : false,
            ddaysText = me.disabledDaysText,
            format = me.format,
            days = eDate.getDaysInMonth(date),
            firstOfMonth = eDate.getFirstDateOfMonth(date),
//            firstDayNoOfYear = Math.ceil((firstOfMonth.setHours(23) - new Date(firstOfMonth.getFullYear(), 0, 1, 0, 0, 0))/86400000),
            weekNoStart = getWeek(firstOfMonth),
            weeksHack = getYearWeeksHacked(firstOfMonth, weekNoStart),
            year = firstOfMonth.getFullYear(),
//            weeks = weeksInYear(year),
            weeks = weeksHack,
            startingPos = firstOfMonth.getDay() - me.startDay + 1, // correction for first week no element
            previousMonth = eDate.add(date, eDate.MONTH, -1),
            ariaTitleDateFormat = me.ariaTitleDateFormat,
            prevStart, current, disableToday, tempDate, html, cls,
            formatValue, value;

        if (weeks !== weeksHack) {
            console.error('something not matched to iso weeks calculation weeks from stackoverflow = %d, hacked version (desired) = %d... %d year', weeks, weeksHack, year);
        }

        if (startingPos <= 1) {
            startingPos += 7;
        }
//        console.log('weekNoStart = %s, firstOfMonth = %s, firstDayNoOfYear = %s', weekNoStart, firstOfMonth, firstDayNoOfYear)

        if (startingPos > 7) {
            weekNoStart--;
            if (weekNoStart <= 0) {
                weekNoStart = weeks;
            }
        }

        days += startingPos;
        prevStart = eDate.getDaysInMonth(previousMonth) - startingPos + 1;
        current = new Date(previousMonth.getFullYear(), previousMonth.getMonth(), prevStart, me.initHour);

        if (me.showToday) {
            tempDate = eDate.clearTime(new Date());
            disableToday = (tempDate < min || tempDate > max ||
            (ddMatch && format && ddMatch.test(eDate.dateFormat(tempDate, format))) ||
            (ddays && ddays.indexOf(tempDate.getDay()) !== -1));

            if (!me.disabled) {
                me.todayBtn.setDisabled(disableToday);
            }
        }

        me.eventEl.dom.setAttribute('aria-busy', 'true');
        var dayNo = 0;

        for (; itemIndex < me.numDays; ++itemIndex) {
            var lineNo = itemIndex >> 3, // divide to 8
                modulo = itemIndex % 8;

            if (modulo === 0) {
                if (weekNoStart > weeks) {
                    weekNoStart -= weeks;
                }
                html = weekNoStart++;
            } else {
                dayNo++;
            }
            if (modulo !== 0) {
                if (dayNo < startingPos) {
                    html = (++prevStart);
                    cls = me.prevCls;
                } else if (dayNo >= days) {
                    html = (++extraDays);
                    cls = me.nextCls;
                } else {
                    html = dayNo - startingPos + 1;
                    cls = me.activeCls;
                }
            }
            textNodes[itemIndex].innerHTML = html;

            if (modulo !== 0) {
                current.setDate(current.getDate() + 1);
                setCellClass(dayNo, cls);
            } else {
                setCellClass(lineNo, cls, true);
            }
        }

        me.eventEl.dom.removeAttribute('aria-busy');

        me.monthBtn.setText(Ext.Date.format(date, me.monthYearFormat));

        function setCellClass (dayOrWeekIndex, cls, isWeek){
            var weekCls = me.weekCls;
            if (!weekCls) {
                weekCls = me.weekCls = 'x-picker-week-no';
            }
            const idSuffix = isWeek ? '-week-' : '-cell-',
                cellCls = isWeek ? weekCls : me.cellCls;

            var cell = cells[itemIndex],
                describedBy = [];

            // Cells are not rendered with ids
            if (!cell.hasAttribute('id')) {
                cell.setAttribute('id', me.id + idSuffix + dayOrWeekIndex);
            }

            if (!isWeek) {
                // store dateValue number as an expando
                value = +eDate.clearTime(current, true);
                cell.firstChild.dateValue = value;

                cell.setAttribute('aria-label', eDate.format(current, ariaTitleDateFormat));

                // Here and below we can't use title attribute instead of data-qtip
                // because JAWS will announce title value before cell content
                // which is not what we need. Also we are using aria-describedby attribute
                // and not placing the text in aria-label because some cells may have
                // compound descriptions (like Today and Disabled day).
                cell.removeAttribute('aria-describedby');
                cell.removeAttribute('data-qtip');

                if (value === today) {
                    cls += ' ' + me.todayCls;
                    describedBy.push(me.id + '-todayText');
                }

                if (value === newDate) {
                    me.activeCell = cell;
                    me.eventEl.dom.setAttribute('aria-activedescendant', cell.id);
                    cell.setAttribute('aria-selected', true);
                    cls += ' ' + me.selectedCls;
                    me.fireEvent('highlightitem', me, cell);
                }
                else {
                    cell.setAttribute('aria-selected', false);
                }

                if (value < min) {
                    cls += ' ' + disabledCls;
                    describedBy.push(me.id + '-ariaMinText');
                    cell.setAttribute('data-qtip', me.minText);
                }
                else if (value > max) {
                    cls += ' ' + disabledCls;
                    describedBy.push(me.id + '-ariaMaxText');
                    cell.setAttribute('data-qtip', me.maxText);
                }
                else if (ddays && ddays.indexOf(current.getDay()) !== -1) {
                    cell.setAttribute('data-qtip', ddaysText);
                    describedBy.push(me.id + '-ariaDisabledDaysText');
                    cls += ' ' + disabledCls;
                }
                else if (ddMatch && format) {
                    formatValue = eDate.dateFormat(current, format);
                    if (ddMatch.test(formatValue)) {
                        cell.setAttribute('data-qtip', ddText.replace('%0', formatValue));
                        describedBy.push(me.id + '-ariaDisabledDatesText');
                        cls += ' ' + disabledCls;
                    }
                }

                if (describedBy.length) {
                    cell.setAttribute('aria-describedby', describedBy.join(' '));
                }
            }

            if (cls) {
                cell.className = cls;
            }
            if (cellCls) {
                if (cell.className) {
                    cell.className += ' ';
                }
                cell.className += cellCls;
            }
        }

        function getYearWeeksHacked(dt, weekNoStart) {
            var ret = 52,
                year = dt.getFullYear();

            if (year === 2009 || year === 2015 || year === 2020 || year === 2026) {
                ret = 53;
            }

            return Math.max(ret, weekNoStart);
        }


        function getWeek(dt) {
            var date = new Date(dt);

            date.setHours(0, 0, 0, 0);
            // Thursday in current week decides the year.
            date.setDate(date.getDate() + 3 - (date.getDay() + 6) % 7);
            // January 4 is always in week 1.
            var week1 = new Date(date.getFullYear(), 0, 4);
            // Adjust to Thursday in week 1 and count number of weeks from date to week1.

            return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000
                    - 3 + (week1.getDay() + 6) % 7) / 7);
        }

        function getWeekNumber(d) {
            // Copy date so don't modify original
            d = new Date(d);
            d.setHours(0,0,0);
            // Set to nearest Thursday: current date + 4 - current day number
            // Make Sunday's day number 7
            d.setDate(d.getDate() + 4 - (d.getDay()||7));
            // Get first day of year
            var yearStart = new Date(d.getFullYear(),0,1);
            // Calculate full weeks to nearest Thursday
            var weekNo = Math.ceil(( ( (d - yearStart) / 86400000) + 1)/7)
            // Return array of year and week number
            return [d.getFullYear(), weekNo];
        }

        function weeksInYear(year) {
            var d = new Date(year, 11, 31);
            var week = getWeekNumber(d)[1];
            return week == 1? getWeekNumber(d.setDate(24))[1] : week;
        }
    }
});
