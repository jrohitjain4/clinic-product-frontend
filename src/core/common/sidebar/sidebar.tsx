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
  const [activeMode, setActiveMode] = useState(localStorage.getItem("activeModuleMode") || "clinic");

  useEffect(() => {
    const handleModeChange = () => {
      setActiveMode(localStorage.getItem("activeModuleMode") || "clinic");
    };
    window.addEventListener("activeModuleModeChange", handleModeChange);
    return () => {
      window.removeEventListener("activeModuleModeChange", handleModeChange);
    };
  }, []);

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
              <ImageWithBasePath src="docyari-logo.svg" alt="Logo" style={{ width: '165px', height: '165px', marginTop: '-65px', marginBottom: '-65px', marginLeft: '-15px' }} />
            </Link>
            {/* Logo Small */}
            <Link to={all_routes.dashboard} className="logo-small">
              <ImageWithBasePath src="docyari-logo.svg" alt="Logo" style={{ width: '60px', height: 'auto', marginLeft: '-10px' }} />
            </Link>
            {/* Logo Dark */}
            <Link to={all_routes.dashboard} className="dark-logo">
              <ImageWithBasePath src="docyari-logo.svg" alt="Logo" style={{ width: '165px', height: '165px', marginTop: '-65px', marginBottom: '-65px', marginLeft: '-15px' }} />
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
                if (activeMode === "therapy") {
                  return section.tittle === "Therapy";
                } else {
                  if (section.tittle === "Therapy") {
                    return false;
                  }
                }

                // Only show Super Admin section to SUPER_ADMIN role, and hide EVERYTHING else
                if (user?.role === "SUPER_ADMIN") {
                  return section.tittle === "Super Admin";
                }

                // For other roles, don't show the Super Admin section
                if (section.tittle === "Super Admin") {
                  return false;
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
                  ? mainLabel?.submenuItems?.filter((title: any) => canSeeMenuItem(title?.label, mainLabel?.tittle))
                  : mainLabel?.submenuItems;

                // Skip rendering if no items left after filter
                if (!filteredItems || filteredItems.length === 0) return null;

                return (
                  <React.Fragment key={`main-${index}`}>
                    {!mainLabel?.hideHeader && (
                      <li className="menu-title">
                        <span>{mainLabel?.tittle}</span>
                      </li>
                    )}
                    <li>
                      <ul>
                        {filteredItems?.map((title: any, i: number) => {
                          let link_array: any = [];
                          if ("submenuItems" in title) {
                            title.submenuItems?.forEach((link: any) => {
                              const cleanLink = link?.link?.split("?")[0];
                              if (cleanLink) link_array.push(cleanLink);
                              if (link?.submenu && "submenuItems" in link) {
                                link.submenuItems?.forEach((item: any) => {
                                  const cleanSubLink = item?.link?.split("?")[0];
                                  if (cleanSubLink) link_array.push(cleanSubLink);
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
                                    if (user?.role === "STAFF") {
                                      return canSeeMenuItem(item?.label, title?.label);
                                    }
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
                                      const currentFullPath = Location.pathname + Location.search;
                                      const hasNestedSubmenu =
                                        !!item?.submenu &&
                                        Array.isArray(item?.submenuItems) &&
                                        item.submenuItems.length > 0;
                                      const isSubActive =
                                        (hasNestedSubmenu &&
                                          item.submenuItems
                                            .map((link: any) => link?.link)
                                            .includes(Location.pathname)) ||
                                        (!hasNestedSubmenu &&
                                          (item?.link?.includes("?")
                                            ? (currentFullPath === item?.link || (item?.link?.includes("tab=roles") && !Location.search))
                                            : item?.link === Location.pathname));

                                      return (
                                        <li
                                          className={`${hasNestedSubmenu
                                            ? "submenu submenu-two"
                                            : ""
                                            } `}
                                          key={`item-${j}`}
                                        >
                                          <Link
                                            to={hasNestedSubmenu ? "#" : item?.link}
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
                                            <i className={`ti ti-${item?.icon || "point"} menu-tree-icon`} />
                                            <span>{item?.label}</span>
                                            {(hasNestedSubmenu ||
                                              item?.customSubmenuTwo) && (
                                                <span className="menu-arrow"></span>
                                              )}
                                          </Link>
                                          {hasNestedSubmenu ? (
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
                                                        <i className={`ti ti-${items?.icon || "box"} menu-tree-icon`} />
                                                        <span>{items?.label}</span>
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
