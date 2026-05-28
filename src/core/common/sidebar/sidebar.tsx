/* eslint-disable */

import { Link, useLocation, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../imageWithBasePath";
import React, { useEffect, useState } from "react";
import { SidebarData } from "./sidebarData";
import { useDispatch, useSelector } from "react-redux";
import { setExpandMenu, setMobileSidebar } from "../../redux/sidebarSlice";
import { updateTheme } from "../../redux/themeSlice";
import { all_routes } from "../../../feature-module/routes/all_routes";
import { canSeeSection, canSeeMenuItem } from "../../utils/staffPermissions";


const Sidebar = () => {
  const Location = useLocation();
  const [subOpen, setSubopen] = useState<any>("");
  const [subsidebar, setSubsidebar] = useState("");
  const dispatch = useDispatch();
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const updateUser = () => {
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        setUser(JSON.parse(savedUser));
      }
    };
    updateUser();

    // Re-check when someone updates localStorage (e.g. from Feature profile sync)
    window.addEventListener("storage", updateUser);
    // Also re-check on focus to capture changes made in other tabs
    window.addEventListener("focus", updateUser);

    return () => {
      window.removeEventListener("storage", updateUser);
      window.removeEventListener("focus", updateUser);
    };
  }, []);

  const toggleSidebar = (title: any) => {
    localStorage.setItem("menuOpened", title);
    if (title === subOpen) {
      setSubopen("");
    } else {
      setSubopen(title);
    }
  };

  const toggleSubsidebar = (subitem: any) => {
    if (subitem === subsidebar) {
      setSubsidebar("");
    } else {
      setSubsidebar(subitem);
    }
  };

  const handleClick = (label: any) => {
    toggleSidebar(label);
  };

  const navigate = useNavigate();
  const themeSettings = useSelector((state: any) => state.theme.themeSettings);

  const handleMiniSidebar = () => {
    const rootElement = document.documentElement;
    const isMini = rootElement.getAttribute("data-layout") === "mini";
    const updatedLayout = isMini ? "default" : "mini";
    dispatch(
      updateTheme({
        "data-layout": updatedLayout,
      })
    );
    if (isMini) {
      rootElement.classList.remove("mini-sidebar");
    } else {
      rootElement.classList.add("mini-sidebar");
    }
  };
  const onMouseEnter = () => {
    dispatch(setExpandMenu(true));
  };
  const onMouseLeave = () => {
    dispatch(setExpandMenu(false));
  };

  const handleLayoutClick = (layout: string) => {
    const layoutSettings: any = {
      "data-layout": "default",
      dir: "ltr",
    };

    switch (layout) {
      case "Default":
        layoutSettings["data-layout"] = "default";
        break;
      case "Hidden":
        layoutSettings["data-layout"] = "hidden";
        break;
      case "Mini":
        layoutSettings["data-layout"] = "mini";
        break;
      case "Hover View":
        layoutSettings["data-layout"] = "hoverview";
        break;
      case "Full Width":
        layoutSettings["data-layout"] = "full-width";
        break;
      case "RTL":
        layoutSettings.dir = "rtl";
        break;
      default:
        break;
    }
    dispatch(updateTheme(layoutSettings));
    navigate("/dashboard");
  };
  const mobileSidebar = useSelector(
    (state: any) => state.sidebarSlice.mobileSidebar
  );
  const toggleMobileSidebar = () => {
    dispatch(setMobileSidebar(!mobileSidebar));
  };
  useEffect(() => {
    const rootElement: any = document.documentElement;
    Object.entries(themeSettings).forEach(([key, value]) => {
      rootElement.setAttribute(key, value);
    });
    if (themeSettings["data-layout"] === "mini") {
      rootElement.classList.add("mini-sidebar");
    } else {
      rootElement.classList.remove("mini-sidebar");
    }
  }, [themeSettings]);



  return (
    <>
      {/* Sidenav Menu Start */}
      <div
        className="sidebar"
        id="sidebar"
        onMouseEnter={onMouseEnter}
        onMouseLeave={onMouseLeave}
      >
        {/* Start Logo */}
        <div className="sidebar-logo">
          <div>
            {/* Logo Normal */}
            <Link to={all_routes.dashboard} className="logo logo-normal">
              <ImageWithBasePath src="sidebar-logo.png" alt="Logo" style={{ height: '60px', width: 'auto' }} />
            </Link>
            {/* Logo Small */}
            <Link to={all_routes.dashboard} className="logo-small">
              <ImageWithBasePath src="sidebar-logo.png" alt="Logo" style={{ height: '45px', width: 'auto' }} />
            </Link>
            {/* Logo Dark */}
            <Link to={all_routes.dashboard} className="dark-logo">
              <ImageWithBasePath src="sidebar-logo.png" alt="Logo" style={{ height: '60px', width: 'auto' }} />
            </Link>
          </div>
          <button
            className="sidenav-toggle-btn btn border-0 p-0 active"
            id="toggle_btn"
            onClick={handleMiniSidebar}
          >
            <i className="ti ti-arrow-left" />
          </button>
          {/* Sidebar Menu Close */}
          <button className="sidebar-close" onClick={toggleMobileSidebar}>
            <i className="ti ti-x align-middle" />
          </button>
        </div>
        {/* End Logo */}
        {/* Sidenav Menu */}
        <div className="sidebar-inner" data-simplebar="">
          <div id="sidebar-menu" className="sidebar-menu">
            <ul>
              {SidebarData?.filter(section => {
                // Only show Super Admin section to SUPER_ADMIN role
                if (section.tittle === "Super Admin") {
                  return user?.role === "SUPER_ADMIN";
                }
                // Hide demo-only sections for admin users
                if (
                  section.tittle === "UI Interface" ||
                  section.tittle === "Help" ||
                  section.tittle === "Authentication" ||
                  section.tittle === "Content"
                ) {
                  return user?.role !== "ADMIN" && user?.role !== "SUPER_ADMIN";
                }
                // ── STAFF permission filtering ──
                if (user?.role === "STAFF") {
                  return canSeeSection(section.tittle);
                }
                return true;
              }).map((mainLabel, index) => {
                // Filter submenu items by staff permissions
                const filteredItems = user?.role === "STAFF"
                  ? mainLabel?.submenuItems?.filter((title: any) => canSeeMenuItem(title?.label))
                  : mainLabel?.submenuItems;

                // Skip rendering if no items left after filter
                if (!filteredItems || filteredItems.length === 0) return null;

                return (
                  <React.Fragment key={`main-${index}`}>
                    <li className="menu-title">
                      <span>{mainLabel?.tittle}</span>
                    </li>
                    <li>
                      <ul>
                        {filteredItems?.map((title: any, i: number) => {
                          let link_array: any = [];
                          if ("submenuItems" in title) {
                            title.submenuItems?.forEach((link: any) => {
                              link_array.push(link?.link);
                              if (link?.submenu && "submenuItems" in link) {
                                link.submenuItems?.forEach((item: any) => {
                                  link_array.push(item?.link);
                                });
                              }
                            });
                          }
                          title.links = link_array;

                          return (
                            <li className="submenu" key={`title-${i}`}>
                              <Link
                                to={title?.submenu ? "#" : title?.link}
                                onClick={() => {
                                  handleClick(title?.label);

                                  if (mainLabel?.tittle === "Layout") {
                                    handleLayoutClick(title?.label);
                                  }
                                }}
                                className={`${subOpen === title?.label ||
                                  title?.links?.includes(Location.pathname)
                                  ? "subdrop"
                                  : ""
                                  } ${title?.links?.includes(Location.pathname) ||
                                    title?.link === Location.pathname
                                    ? "active"
                                    : ""
                                  }`}
                              >
                                <i className={`ti ti-${title.icon}`}></i>
                                <span>{title?.label}</span>
                                {(title?.submenu || title?.customSubmenuTwo) && (
                                  <span className="menu-arrow"></span>
                                )}
                                {title?.submenu === false &&
                                  title?.version === "v1.6.7" && (
                                    <span className="badge bg-danger ms-2 rounded-2 badge-md fs-12 fw-medium">
                                      v1.6.7
                                    </span>
                                  )}
                              </Link>

                              {title?.submenu !== false && (
                                <ul
                                  style={{
                                    display:
                                      subOpen === title?.label ||
                                        title?.links?.includes(Location.pathname)
                                        ? "block"
                                        : "none",
                                  }}
                                >
                                  {title?.submenuItems?.filter((item: any) => {
                                    if (user?.role === "ADMIN" || user?.role === "SUPER_ADMIN") {
                                      if (item.label === "Doctor Dashboard" || item.label === "Patient Dashboard") return false;
                                    } else if (user?.role === "DOCTOR") {
                                      if (item.label === "Admin Dashboard" || item.label === "Patient Dashboard") return false;
                                    } else if (user?.role === "PATIENT") {
                                      if (item.label === "Admin Dashboard" || item.label === "Doctor Dashboard") return false;
                                    }
                                    return true;
                                  }).map(
                                    (item: any, j: any) => {
                                      const isSubActive =
                                        item?.submenuItems
                                          ?.map((link: any) => link?.link)
                                          .includes(Location.pathname) ||
                                        item?.link === Location.pathname;

                                      return (
                                        <li
                                          className={`${item?.submenuItems
                                            ? "submenu submenu-two"
                                            : ""
                                            } `}
                                          key={`item-${j}`}
                                        >
                                          <Link
                                            to={item?.submenu ? "#" : item?.link}
                                            className={`${isSubActive ? "active subdrop" : ""
                                              } ${subsidebar === item?.label
                                                ? "subdrop"
                                                : ""
                                              }`}
                                            onClick={() => {
                                              toggleSubsidebar(item?.label);
                                              if (title?.label === "Layouts") {
                                                handleLayoutClick(item?.label);
                                              }
                                            }}


                                          >
                                            {item?.label}
                                            {(item?.submenu ||
                                              item?.customSubmenuTwo) && (
                                                <span className="menu-arrow"></span>
                                              )}
                                          </Link>
                                          {item?.submenuItems ? (
                                            <ul
                                              style={{
                                                display:
                                                  subsidebar === item?.label
                                                    ? "block"
                                                    : "none",
                                              }}
                                            >
                                              {item?.submenuItems?.map(
                                                (items: any, k: any) => {
                                                  const isSubSubActive =
                                                    items?.submenuItems
                                                      ?.map(
                                                        (link: any) => link.link
                                                      )
                                                      .includes(
                                                        Location.pathname
                                                      ) ||
                                                    items?.link ===
                                                    Location.pathname;

                                                  return (
                                                    <li key={`submenu-item-${k}`}>
                                                      <Link
                                                        to={
                                                          items?.submenu
                                                            ? "#"
                                                            : items?.link
                                                        }
                                                        className={`${isSubSubActive
                                                          ? "active"
                                                          : ""
                                                          }`}
                                                      >
                                                        {items?.label}
                                                      </Link>
                                                    </li>
                                                  );
                                                }
                                              )}
                                            </ul>
                                          ) : null}
                                        </li>
                                      );
                                    }
                                  )}
                                </ul>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </li>
                  </React.Fragment>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
      {/* Sidenav Menu End */}
    </>
  );
};

export default Sidebar;
