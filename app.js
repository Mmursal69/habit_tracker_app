let state={habits:[],history:{},currentweekmonday:null};

document.addEventListener("DOMContentLoaded",()=>{
    loaddata();
    setweektocurrent();
    renderapp();
    setupeventlisteners();
});

function loaddata(){
    const savedhabits=localStorage.getItem("pulse_habits");
    const savedhistory=localStorage.getItem("pulse_history");
    state.habits=savedhabits?JSON.parse(savedhabits):[];
    state.history=savedhistory?JSON.parse(savedhistory):{};
}

function savedata(){
    localStorage.setItem("pulse_habits",JSON.stringify(state.habits));
    localStorage.setItem("pulse_history",JSON.stringify(state.history));
}

function setweektocurrent(){
    const today=new Date();
    state.currentweekmonday=getmondayofdate(today);
}

function getmondayofdate(date){
    const d=new Date(date);
    const day=d.getDay();
    const diff=d.getDate()-day+(day===0?-6:1);
    const monday=new Date(d.setDate(diff));
    monday.setHours(0,0,0,0);
    return monday;
}

function getdaysofweek(mondaydate){
    const days=[];
    for(let i=0;i<7;i++){
        const nextday=new Date(mondaydate);
        nextday.setDate(mondaydate.getDate()+i);
        days.push(nextday);
    }
    return days;
}

function formatdatestring(date){
    const year=date.getFullYear();
    const month=String(date.getMonth()+1).padStart(2,'0');
    const day=String(date.getDate()).padStart(2,'0');
    return `${year}-${month}-${day}`;
}

function calculatecurrentstreak(habitid){
    const records=state.history[habitid]||[];
    if(records.length===0)return 0;

    const recordset=new Set(records);
    const today=new Date();
    today.setHours(0,0,0,0);
    
    const yesterday=new Date(today);
    yesterday.setDate(today.getDate()-1);

    const todaystr=formatdatestring(today);
    const yesterdaystr=formatdatestring(yesterday);
    let checkdate=null;

    if(recordset.has(todaystr)){
        checkdate=today;
    }else if(recordset.has(yesterdaystr)){
        checkdate=yesterday;
    }else{
        return 0;
    }

    let streakcount=0;
    while(true){
        const checkstr=formatdatestring(checkdate);
        if(recordset.has(checkstr)){
            streakcount++;
            checkdate.setDate(checkdate.getDate()-1);
        }else{
            break;
        }
    }
    return streakcount;
}

function renderapp(){
    const emptystateel=document.getElementById("empty_state");
    const gridcontainerel=document.getElementById("grid_container");
    
    if(state.habits.length===0){
        emptystateel.classList.remove("hidden");
        gridcontainerel.style.display="none";
        updateweeklabelonly();
        return;
    }

    emptystateel.classList.add("hidden");
    gridcontainerel.style.display="block";
    const days=getdaysofweek(state.currentweekmonday);
    rendertableheader(days);
    rendertablerows(days);
}

function updateweeklabelonly(){
    const days=getdaysofweek(state.currentweekmonday);
    const startstr=days[0].toLocaleDateString('en-US',{month:'short',day:'numeric'});
    const endstr=days[6].toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric'});
    document.getElementById("week_label").textContent=`${startstr} – ${endstr}`;
}

function rendertableheader(days){
    const headerrow=document.getElementById("table_header_row");
    const todaystr=formatdatestring(new Date());
    let html=`<th class="col_action">Action</th>`;

    days.forEach(day=>{
        const daystr=formatdatestring(day);
        const istoday=daystr===todaystr;
        const dayname=day.toLocaleDateString('en-US',{weekday:'short'});
        const daynum=day.getDate();
        html+=`
            <th class="col_day ${istoday?'today_col':''}">
                <div>${dayname}</div>
                <div style="font-size: 1.1rem; margin-top: 0.2rem; color: var(--text-primary);">${daynum}</div>
            </th>`;
    });

    html+=`<th class="col_streak">Streak</th>`;
    headerrow.innerHTML=html;
}

function rendertablerows(days){
    const tablebody=document.getElementById("table_body");
    const todaystr=formatdatestring(new Date());
    const startoftoday=new Date();
    startoftoday.setHours(0,0,0,0);
    let html="";

    state.habits.forEach(habit=>{
        const records=state.history[habit.id]||[];
        const currentstreak=calculatecurrentstreak(habit.id);

        html+=`
            <tr class="row_habit_name">
                <td colspan="8" class="habit_name_cell">
                    <span class="habit_name_text" onclick="renamehabit('${habit.id}')" title="Click to rename">${escapehtml(habit.name)}</span>
                </td>
                <td rowspan="2" class="streak_cell">
                    <div class="streak_circle" title="Current streak">
                        <span class="streak_num">${currentstreak}</span>
                        <span class="streak_text">days</span>
                    </div>
                </td>
            </tr><tr class="row_habit_data"><td class="col_action">
                <button class="action_icon_btn" onclick="deletehabit('${habit.id}')" title="Delete habit">DELETE</button>
            </td>`;
        
        days.forEach(day=>{
            const daystr=formatdatestring(day);
            const ischecked=records.includes(daystr);
            const istoday=daystr===todaystr;
            const isfuture=day>startoftoday;

            html+=`
                <td class="col_day ${istoday?'today_col':''}">
                    <button 
                        class="cell_toggle ${ischecked?'checked':''}" 
                        onclick="toggleday('${habit.id}','${daystr}')"
                        ${isfuture?'disabled':''}
                        aria-label="Toggle ${escapehtml(habit.name)} for ${daystr}">
                    </button>
                </td>`;
        });
        html+=`</tr>`;
    });
    tablebody.innerHTML=html;
}

function toggleday(habitid,datestr){
    if(!state.history[habitid]){
        state.history[habitid]=[];
    }
    const index=state.history[habitid].indexOf(datestr);
    if(index>-1){
        state.history[habitid].splice(index,1);
    }else{
        state.history[habitid].push(datestr);
    }
    savedata();
    renderapp();
}

function renamehabit(habitid){
    const habit=state.habits.find(h=>h.id===habitid);
    if(!habit)return;
    const newname=prompt("Rename your habit:",habit.name);
    if(newname===null)return; 
    const trimmed=newname.trim();
    if(trimmed===""){
        alert("Habit name cannot be empty.");
        return;
    }
    habit.name=trimmed;
    savedata();
    renderapp();
}

function deletehabit(habitid){
    if(!confirm("Are you sure you want to delete this habit and all its history?"))return;
    state.habits=state.habits.filter(h=>h.id!==habitid);
    delete state.history[habitid];
    savedata();
    renderapp();
}

function setupeventlisteners(){
    document.getElementById("add_habit_form").addEventListener("submit",(e)=>{
        e.preventDefault();
        const input=document.getElementById("habit_input");
        const name=input.value.trim();
        if(name){
            const newhabit={id:"habit_"+Date.now(),name:name};
            state.habits.push(newhabit);
            state.history[newhabit.id]=[];
            savedata();
            input.value="";
            renderapp();
        }
    });

    document.getElementById("prev_week_btn").addEventListener("click",()=>{
        state.currentweekmonday.setDate(state.currentweekmonday.getDate()-7);
        renderapp();
    });

    document.getElementById("next_week_btn").addEventListener("click",()=>{
        state.currentweekmonday.setDate(state.currentweekmonday.getDate()+7);
        renderapp();
    });

    document.getElementById("current_week_btn").addEventListener("click",()=>{
        setweektocurrent();
        renderapp();
    });
}

function escapehtml(text){
    return text.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;");
}