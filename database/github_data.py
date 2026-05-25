from datetime import date, timedelta

PROFILE_DATA = {
    "nickname": "muqzir06",
    "fullname": "Muneeb Muqzir",
    "avatar_url": "https://avatars.githubusercontent.com/u/227600253?v=4",
    "bio": "Frontend Web Developer | Specialized in HTML, CSS & Responsive Design",
    "followers": 0,
    "following": 0,
    "total_repos": 23,
    "pinned_repos": [
        {
            "name": "HBO-project-cloning_1",
            "desc": "A responsive streaming interface clone mimicking the HBO website layout. Built to master complex layouts, CSS Flexbox, and hover states.",
            "lang": "CSS",
            "lang_color": "#563d7c",
            "stars": 0,
            "forks": 0,
            "url": "https://github.com/muqzir06/HBO-project-cloning_1"
        },
        {
            "name": "TNSDC-FWD-DigitalPortfolio",
            "desc": "A personal digital portfolio showcasing frontend web designs and coursework. Created as part of the TNSDC Future Skills program.",
            "lang": "HTML",
            "lang_color": "#e34c26",
            "stars": 0,
            "forks": 0,
            "url": "https://github.com/muqzir06/TNSDC-FWD-DigitalPortfolio"
        },
        {
            "name": "TITE-CLASS-1",
            "desc": "A collaboration project featuring lecture templates, HTML layout assignments, and basic scripting exercises.",
            "lang": "HTML",
            "lang_color": "#e34c26",
            "stars": 0,
            "forks": 0,
            "url": "https://github.com/muqzir06/TITE-CLASS-1"
        },
        {
            "name": "muneeb-11",
            "desc": "Personal styling playground exploring modern CSS grid alignment, custom media queries, and dark/light mode toggles.",
            "lang": "CSS",
            "lang_color": "#563d7c",
            "stars": 0,
            "forks": 0,
            "url": "https://github.com/muqzir06/muneeb-11"
        },
        {
            "name": "raiyan-bca-1",
            "desc": "Responsive BCA degree project template styled with pure vanilla CSS to practice modular layout design.",
            "lang": "CSS",
            "lang_color": "#563d7c",
            "stars": 0,
            "forks": 0,
            "url": "https://github.com/muqzir06/raiyan-bca-1"
        },
        {
            "name": "mazan-1010",
            "desc": "Web layout design experiment utilizing absolute positioning overlays and sleek hover micro-animations.",
            "lang": "CSS",
            "lang_color": "#563d7c",
            "stars": 0,
            "forks": 0,
            "url": "https://github.com/muqzir06/mazan-1010"
        }
    ]
}

# Key 2026 contribution days extracted from the profile fragment
ACTIVE_CONTRIBUTION_DAYS = {
    "2026-02-03": {"count": 4, "level": 4},
    "2026-02-05": {"count": 2, "level": 2},
    "2026-02-17": {"count": 2, "level": 2},
    "2026-02-23": {"count": 2, "level": 2},
    "2026-03-05": {"count": 2, "level": 2}
}

def get_contribution_calendar():
    """
    Generates all calendar days for 2026.
    Ensures that days have date strings (YYYY-MM-DD), contribution counts, and styling levels (0-4).
    """
    start_date = date(2026, 1, 1)
    end_date = date(2026, 12, 31)
    
    calendar_days = []
    current = start_date
    while current <= end_date:
        date_str = current.strftime("%Y-%m-%d")
        
        # Determine day index for alignment (0 = Sunday, 1 = Monday, etc.)
        # weekday() returns 0 for Monday, 6 for Sunday
        # GitHub calendar starts with Sunday (day 0)
        day_of_week = (current.weekday() + 1) % 7
        
        if date_str in ACTIVE_CONTRIBUTION_DAYS:
            day_data = {
                "date": date_str,
                "count": ACTIVE_CONTRIBUTION_DAYS[date_str]["count"],
                "level": ACTIVE_CONTRIBUTION_DAYS[date_str]["level"],
                "day_of_week": day_of_week,
                "month_name": current.strftime("%b")
            }
        else:
            day_data = {
                "date": date_str,
                "count": 0,
                "level": 0,
                "day_of_week": day_of_week,
                "month_name": current.strftime("%b")
            }
        calendar_days.append(day_data)
        current += timedelta(days=1)
        
    return calendar_days

ACTIVITIES_2026 = [
    {
        "date": "March 05, 2026",
        "repo": "mazan-1010",
        "commits": 2,
        "desc": "Pushed 2 commits to main branch updating styling configurations.",
        "icon": "fa-solid fa-code-commit"
    },
    {
        "date": "February 23, 2026",
        "repo": "raiyan-bca-1",
        "commits": 2,
        "desc": "Updated flexbox layout styles for responsive mobile viewing.",
        "icon": "fa-solid fa-code-commit"
    },
    {
        "date": "February 17, 2026",
        "repo": "muneeb-11",
        "commits": 2,
        "desc": "Integrated color grid variables and updated README details.",
        "icon": "fa-solid fa-code-commit"
    },
    {
        "date": "February 05, 2026",
        "repo": "TITE-CLASS-1",
        "commits": 2,
        "desc": "Pushed lecture 2 exercises on CSS selectors and responsive box sizing.",
        "icon": "fa-solid fa-code-commit"
    },
    {
        "date": "February 03, 2026",
        "repo": "TNSDC-FWD-DigitalPortfolio",
        "commits": 4,
        "desc": "Created repository, initialized index.html, and pushed initial structure.",
        "icon": "fa-solid fa-circle-plus"
    }
]
