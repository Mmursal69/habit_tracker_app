## 1. How to run
Any sort of installation is not needed. simply download and double click index.html to view the project

## 2. Stack and design choices
**Stack:** I used simple html,css and javascript because i didnot have much experience in frontend so i choose that i knew the most about.

**Design Choice 1 (Circle Streak):** At the start the streak days were inside the rows. This made the table look a bit crammed and not visually appealing. I fixed that by removing it from the rows and putting it seperately at the end as a circle with the number of days in it. I also centralized them according to the streak label above by using "vertical-align: middle;". Also i adjusted the padding of the whole row so that the streak circle is aligned properly.

**Design Choice 2 (Monday Start):** i decided to make the week start on monday instead of sunday. it just makes more sense because monday is when the actual work or school week starts for most people, which is when you want to start tracking habits or when you start your new goals.

## 3. Responsive and accessibility
**Responsive:** i checked how it looks on a small phone screen (360px) in dev tools and noticed the delete button was overlapping the monday checkbox. For this fix i added a media query in which the width is adjusted when the screen size is less than 600px.

**Accessibility:** i made sure my custom light color palette had high contrast so the dark text is easily readable against the background. also, the checkmark toggles are built using actual `<button>` tags instead of just divs, which means someone can use the tab key to move through them and the spacebar to click, without needing a mouse.

## 4. AI usage
**Tool:** Gemini 1.5 Pro
**Usage:** I used ai to first write a basic boiler plate code to get an idea of what i want to write. Specifically the `localStorage` JSON parsing logic and the raw date math functions required to generate the rolling 7-day calendar. It took me sometime to understand the syntax and write the code. 

**What i changed:** The ai originally gave me a really bad and cramped table/page layout that looked bad. Also everything was in the center for no reason. I completely changed the html and css to split the habits into a cleaner card layout with the name on top to fix the padding issues so boxes donot overlap on smaller screens, and used custom colour palettes i got from the internet.

## 5. Honest gap
Right now when you add or delete a habit it just instantly pops in or disappears. if i had another day i would add some smooth transitions so it looks way better.