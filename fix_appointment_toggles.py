import os
import codecs
import re

# Files to fix manually with their specific toggle routes
FIXES = [
    {
        'file': 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/clinic-modules/appointment-calendar/appointmentCalendar.tsx',
        'list_route': '{all_routes.appointments}',
        'grid_route': '{all_routes.appointmentCalendar}',
        'list_active': False,
        'grid_active': True,
    },
    {
        'file': 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/doctor-modules/doctor-appointments/doctorAppointments.tsx',
        'list_route': '{all_routes.doctorsappointments}',
        'grid_route': '{all_routes.doctorsappointmentdetails}',
        'list_active': True,
        'grid_active': False,
    },
    {
        'file': 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/doctor-modules/doctors-appointment-details/doctorsAppointmentDetails.tsx',
        'list_route': '{all_routes.doctorsappointments}',
        'grid_route': '{all_routes.doctorsappointmentdetails}',
        'list_active': False,
        'grid_active': True,
    },
    {
        'file': 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/patient-modules/patient-appointment-details/patientAppointmentDetails.tsx',
        'list_route': '{all_routes.patientAppointments}',
        'grid_route': '{all_routes.patientAppointmentDetails}',
        'list_active': False,
        'grid_active': True,
    },
    {
        'file': 'c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/patient-modules/patient-appointments/patientAppointments.tsx',
        'list_route': '{all_routes.patientAppointments}',
        'grid_route': '{all_routes.patientAppointmentDetails}',
        'list_active': True,
        'grid_active': False,
    },
]

def list_btn_class(active):
    if active:
        return 'btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary d-flex align-items-center justify-content-center'
    return 'btn btn-icon btn-sm bg-white text-dark border d-flex align-items-center justify-content-center'

def new_toggle_buttons(list_route, grid_route, list_active, grid_active):
    return f'''<div className="d-flex align-items-center gap-2">
                <Link
                  to={list_route}
                  className="{list_btn_class(list_active)}"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-list-tree fs-16" />
                </Link>
                <Link
                  to={grid_route}
                  className="{list_btn_class(grid_active)}"
                  style={{{{ width: '38px', height: '38px', borderRadius: '8px' }}}}
                >
                  <i className="ti ti-calendar-event fs-16" />
                </Link>
              </div>'''

# Pattern for the old merged toggle button container  
OLD_TOGGLE_PATTERN = r'<div className="bg-white border shadow-sm rounded px-1 pb-0 text-center d-flex align-items-center justify-content-center[^"]*">(.*?)</div>'

for fix in FIXES:
    filepath = fix['file']
    if not os.path.exists(filepath):
        print(f"MISSING: {filepath}")
        continue
    
    with codecs.open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    new_btns = new_toggle_buttons(
        fix['list_route'], fix['grid_route'],
        fix['list_active'], fix['grid_active']
    )
    
    content = re.sub(OLD_TOGGLE_PATTERN, new_btns, content, count=1, flags=re.DOTALL)
    
    # Also fix the border class: "border-1 border-bottom" -> "border-bottom"
    content = content.replace('border-1 border-bottom', 'border-bottom')
    
    # Fix empty filter rows
    empty_pattern = r'\s*{/\*\s*Start Filter\s*\*/}\s*<div className=" d-flex align-items-center justify-content-between flex-wrap row-gap-3">(.*?)</div>\s*{/\*\s*End Filter\s*\*/}'
    
    def should_remove(match):
        inner = match.group(1)
        # Remove if contains only empty search-set and empty table-dropdown
        if re.search(r'<div className="search-set mb-3">\s*<div[^>]*>\s*</div>\s*</div>', inner) and \
           re.search(r'<div className="d-flex table-dropdown[^"]*">\s*</div>', inner):
            return ''
        return match.group(0)
    
    content = re.sub(empty_pattern, should_remove, content, flags=re.DOTALL)
    
    if content != original:
        with codecs.open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        print(f'Fixed: {filepath}')
    else:
        print(f'No change: {filepath}')
