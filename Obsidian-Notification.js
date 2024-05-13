const date_format = "yyyy-MM-dd HH:mm"
const NotificationTime = "09:00"
const NotificationGroup = "Obisidian"
const FileBookmark =  "Obsidian"
const fmgr = FileManager.local()
const TaskIdentifier = "#todo"
const LineBreaks = "\n"
const search_task = "- [ ] "
const search_date = "📅"


function readTasksConfig(){
    //TODO: read out taskidentifier 
    //path = ".obsidian/plugins/obsidian-tasks-plugin"
}

// Hash function for Notification Identifier (atm the path is used as short hash)
function hashCode(s) {
    let h;
    for(let i = 0; i < s.length; i++) 
          h = Math.imul(31, h) + s.charCodeAt(i) | 0;
    return Math.abs(h).toString(16);
}

function checkSetup(){
    if(fmgr.bookmarkExists(FileBookmark)){
        return obsi_root = fmgr.bookmarkedPath(FileBookmark)
    }else{
        console.error("Did not found Scriptable Bookmark: " + FileBookmark)
        Script.complete()
    }
}

function filter_in_array(array, pattern){
    //keep items when pattern found
    return array.filter((element) => element.indexOf(pattern) > -1)
}

function filter_not_in_array(array, pattern){
    //keep items when pattern not found
    return array.filter((element) => element.indexOf(pattern) == -1)
}

function getTasks(file){
    if(file.endsWith(".md")){

        let data = fmgr.read(file).toRawString()
        let items = data.split(LineBreaks)

        // just keep relevant items
        // finished item not needed, cause it has - [x]
        items = filter_in_array(items, search_task)
        items = filter_in_array(items, search_date)
        if(TaskIdentifier.length > 0){
            items = filter_in_array(items, TaskIdentifier)
        }

        return items
    }else{
        //console.log("skip non MD File: " + file)
        return []
    }
}

function Notification_create(title, body, date, identifier){
    let today = new Date()
    let fmt = new DateFormatter()
    fmt.dateFormat = date_format
    let date_target = date + " " + NotificationTime
    date_target = fmt.date(date_target)

    let note = new Notification()
    note.identifier = identifier
    note.title = NotificationGroup
    note.subtitle = title
    note.body = body

    //if Task is in the past, remind tomorrow
    if(date_target < today){
        today.setDate(today.getDate() + 1)
        //TODO: hardcoded, should be configured via const
        today.setHours(9,0)
        date_target = today
    }
    note.setTriggerDate(date_target)
    note.schedule()
}

function iterateFiles(root_path) {

    let task_count = 0
    let files = [root_path]

    while (files.length > 0) {
        let item = files.pop()

        if (fmgr.isDirectory(item)) {
            let list_files = fmgr.listContents(item)

            //Filter .git + .obsidian files
            list_files = filter_not_in_array(list_files, ".git")
            list_files = filter_not_in_array(list_files, ".gitignore")
            list_files = filter_not_in_array(list_files, ".obsidian")

            //merge files with path
            list_files = list_files.map(i => item + "/" + i)
            files.push.apply(files, list_files)

        }else if(fmgr.fileExists(item)){

            let tasks = getTasks(item)
            if (tasks.length > 0) {
                task_count += tasks.length
                tasks.forEach(task => {
                    let pos_date = task.indexOf(search_date)
                    let date = task.substring(pos_date+2, pos_date+2+11)

                    let pos_task = task.indexOf(search_task)
                    let body = task.substring(pos_task+5, pos_date)

                    let identifier = hashCode(item) + "-" + hashCode(body)

                    //Create Task Title based on "First Directory/Filename"
                    let item_splitter = item.split("/")
                    let note_title = item_splitter[root_path.split("/").length]
                    let note_file = item_splitter[item_splitter.length-1]
                    if(note_title == note_file){
                        note_title = "Root"
                    }
                    note_title += "/" + note_file
                    Notification_create(note_title, body, date, identifier)
                    
                });
            }
        }else{
            console.error("Shouldnt be happen on " + item)
        }
    }
    console.log("ToDos Notification created: " + task_count.toString())
}

async function main(){
    let path_root = checkSetup()

    //remove current state of Obsidian Notifications
    let pend = await Notification.allPending()
    pend.forEach(note => {
        if(note.title == NotificationGroup){
            note.remove()
        }
    });
    //iterate Files and create notifications
    iterateFiles(path_root)
}

main()
