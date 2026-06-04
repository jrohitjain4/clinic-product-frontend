import codecs

def replace_in_file(filepath, search_str, replace_str):
    try:
        with codecs.open(filepath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        if search_str in content:
            new_content = content.replace(search_str, replace_str)
            with codecs.open(filepath, 'w', encoding='utf-8') as f:
                f.write(new_content)
            print(f"Successfully updated {filepath}")
        else:
            print(f"Search string not found in {filepath}")
    except Exception as e:
        print(f"Error: {e}")

search_list = """          <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
            <Link
              to="#"
              className="btn btn-sm btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#add_todo"
            >
              <i className="ti ti-circle-plus me-1" />
              Create New
            </Link>
            <ul className="d-flex align-items-center flex-shrink-0 list-unstyled mb-0">
              <li>
                <Link
                  to={all_routes.todo}
                  className="btn btn-icon btn-sm bg-white text-dark me-2"
                >
                  <i className="ti ti-layout-grid" />
                </Link>
              </li>
              <li>
                <Link
                  to={all_routes.todoList}
                  className="btn btn-icon btn-sm bg-primary text-white active me-2"
                >
                  <i className="ti ti-list-tree" />
                </Link>
              </li>
            </ul>
          </div>"""

replace_list = """          <div className="d-flex align-items-center justify-content-end flex-wrap gap-3 mb-3">
            <ul className="d-flex align-items-center flex-shrink-0 list-unstyled mb-0">
              <li>
                <Link
                  to={all_routes.todo}
                  className="btn btn-icon btn-sm bg-white text-dark border me-2"
                >
                  <i className="ti ti-layout-grid" />
                </Link>
              </li>
              <li>
                <Link
                  to={all_routes.todoList}
                  className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary active me-2"
                >
                  <i className="ti ti-list-tree" />
                </Link>
              </li>
            </ul>
            <Link
              to="#"
              className="btn btn-sm btn-primary"
              data-bs-toggle="modal"
              data-bs-target="#add_todo"
            >
              <i className="ti ti-circle-plus me-1" />
              Create New
            </Link>
          </div>"""

replace_in_file('c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todoList.tsx', search_list, replace_list)

search_grid = """        <div className="d-flex align-items-center justify-content-between flex-wrap gap-2 mb-3">
          <Link
            to="#"
            className="btn btn-sm btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#add_todo"
          >
            <i className="ti ti-circle-plus me-1" />
            Create New
          </Link>
          <ul className="d-flex align-items-center flex-shrink-0 list-unstyled mb-0">
            <li>
              <Link
                to={all_routes.todo}
                className="btn btn-icon btn-sm bg-primary text-white active me-2"
              >
                <i className="ti ti-layout-grid" />
              </Link>
            </li>
            <li>
              <Link
                to={all_routes.todoList}
                className="btn btn-icon btn-sm bg-white text-dark me-2"
              >
                <i className="ti ti-list-tree" />
              </Link>
            </li>
          </ul>
        </div>"""

replace_grid = """        <div className="d-flex align-items-center justify-content-end flex-wrap gap-3 mb-3">
          <ul className="d-flex align-items-center flex-shrink-0 list-unstyled mb-0">
            <li>
              <Link
                to={all_routes.todo}
                className="btn btn-icon btn-sm bg-primary-subtle text-primary border border-primary active me-2"
              >
                <i className="ti ti-layout-grid" />
              </Link>
            </li>
            <li>
              <Link
                to={all_routes.todoList}
                className="btn btn-icon btn-sm bg-white text-dark border me-2"
              >
                <i className="ti ti-list-tree" />
              </Link>
            </li>
          </ul>
          <Link
            to="#"
            className="btn btn-sm btn-primary"
            data-bs-toggle="modal"
            data-bs-target="#add_todo"
          >
            <i className="ti ti-circle-plus me-1" />
            Create New
          </Link>
        </div>"""

replace_in_file('c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/feature-module/components/pages/application-modules/application/todo/todo.tsx', search_grid, replace_grid)

search_sidebar = """          {
            menuValue: "To Do",
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.todo,
            link: routes.todo,
            base: "todo",
          },"""

replace_sidebar = """          {
            menuValue: "To Do",
            hasSubRoute: false,
            showSubRoute: false,
            route: routes.todoList,
            link: routes.todoList,
            base: "todo",
          },"""

replace_in_file('c:/Users/hp/Desktop/Doctor/clinic-product-frontend/src/core/common/sidebar/sidebarData.tsx', search_sidebar, replace_sidebar)
