# Obsidian Tasks - iOS Push Notification Workaround

[This script](/Obsidian-Notification.js) creates Notification in [Scriptable](https://apps.apple.com/de/app/scriptable/id1405459188) based on Tasks created in Obsidian.

The process in short:
- iterates through all files
- filter all items which contains `- [ ] `, `📅`, and the defined task identifier (default `#todo`)
- extract date from task
- and sets the notification.
