import { lazy } from "react";
const EmailVerificationBasic = lazy(() => import("../components/auth/email-verification/emailVerificationBasic"));
const EmailVerificationCover = lazy(() => import("../components/auth/email-verification/emailVerificationCover"));
const EmailVerificationIllustration = lazy(() => import("../components/auth/email-verification/emailVerificationIllustration"));
const Error404 = lazy(() => import("../components/auth/error-modules/error404"));
const Error500 = lazy(() => import("../components/auth/error-modules/error500"));
const ForgotPasswordBasic = lazy(() => import("../components/auth/forgot-password/forgotPasswordBasic"));
const ForgotPasswordCover = lazy(() => import("../components/auth/forgot-password/forgotPasswordCover"));
const ForgotPasswordIllustration = lazy(() => import("../components/auth/forgot-password/forgotPasswordIllustration"));
const LockScreen = lazy(() => import("../components/auth/lock-screen/lockScreen"));
const HomePage = lazy(() => import("../components/pages/home/homePage"));
const AboutUs = lazy(() => import("../components/pages/home/aboutUs"));
const ServicesFront = lazy(() => import("../components/pages/home/servicesFront"));
const ContactUs = lazy(() => import("../components/pages/home/contactUs"));
const PrivacyPolicyFront = lazy(() => import("../components/pages/home/privacyPolicyFront"));
const TermsConditionFront = lazy(() => import("../components/pages/home/termsConditionFront"));
const RefundPolicyFront = lazy(() => import("../components/pages/home/refundPolicyFront"));
const Login = lazy(() => import("../components/auth/login/login"));
const LoginBasic = lazy(() => import("../components/auth/login/loginBasic"));
const LoginCover = lazy(() => import("../components/auth/login/loginCover"));
const LoginIllustration = lazy(() => import("../components/auth/login/loginIllustration"));
const MultiStepRegister = lazy(() => import("../components/auth/register/MultiStepRegister"));
const RegisterCover = lazy(() => import("../components/auth/register/registerCover"));
const RegisterIllustration = lazy(() => import("../components/auth/register/registerIllustration"));
const ResetPasswordBasic = lazy(() => import("../components/auth/reset-password/resetPasswordBasic"));
const ResetPasswordCover = lazy(() => import("../components/auth/reset-password/resetPasswordCover"));
const ResetPasswordIllustration = lazy(() => import("../components/auth/reset-password/resetPasswordIllustration"));
const TwoStepVerificationBasic = lazy(() => import("../components/auth/two-step-verification/twoStepVerificationBasic"));
const TwoStepVerificationCover = lazy(() => import("../components/auth/two-step-verification/twoStepVerificationCover"));
const TwoStepVerificationIllustration = lazy(() => import("../components/auth/two-step-verification/twoStepVerificationIllustration"));
const AppointmentReport = lazy(() => import("../components/pages/administration-modules/reports/appointment-report/appointmentReport"));
const ExpenseReport = lazy(() => import("../components/pages/administration-modules/reports/expense-report/expenseReport"));
const IncomeReport = lazy(() => import("../components/pages/administration-modules/reports/income-report/incomeReport"));
const PatientReport = lazy(() => import("../components/pages/administration-modules/reports/patient-report/patientReport"));
const ProfitAndLoss = lazy(() => import("../components/pages/administration-modules/reports/profit-and-loss/profitAndLoss"));
const DeleteAccountRequest = lazy(() => import("../components/pages/administration-modules/users/delete-account-request/deleteAccountRequest"));
const Permissions = lazy(() => import("../components/pages/administration-modules/users/permissions/permissions"));
const RolesAndPermissions = lazy(() => import("../components/pages/administration-modules/users/roles-and-permissions/rolesAndPermissions"));
const PackagesAdmin = lazy(() => import("../components/pages/super-admin/packages/PackagesAdmin"));
const TenantsAdmin = lazy(() => import("../components/pages/super-admin/tenants/TenantsAdmin"));
const PrivacyPolicyAdmin = lazy(() => import("../components/pages/super-admin/settings/PrivacyPolicyAdmin"));
const TermsConditionAdmin = lazy(() => import("../components/pages/super-admin/settings/TermsConditionAdmin"));
const RefundPolicyAdmin = lazy(() => import("../components/pages/super-admin/settings/RefundPolicyAdmin"));
const DemoBookingsAdmin = lazy(() => import("../components/pages/super-admin/demo-bookings/DemoBookingsAdmin"));
const ContactSettingsAdmin = lazy(() => import("../components/pages/super-admin/settings/ContactSettingsAdmin"));
const EmailSettingsAdmin = lazy(() => import("../components/pages/super-admin/settings/EmailSettingsAdmin"));
const RazorpaySettingsAdmin = lazy(() => import("../components/pages/super-admin/settings/RazorpaySettingsAdmin"));
const Calendars = lazy(() => import("../components/pages/application-modules/application/calendar/calendar"));
const CallHistory = lazy(() => import("../components/pages/application-modules/application/calls/callHistory"));
const IncomingCall = lazy(() => import("../components/pages/application-modules/application/calls/incomingCall"));
const OutGoingCall = lazy(() => import("../components/pages/application-modules/application/calls/outGoingCall"));
const VideoCall = lazy(() => import("../components/pages/application-modules/application/calls/videoCall"));
const VoiceCalls = lazy(() => import("../components/pages/application-modules/application/calls/voiceCall"));
const Chat = lazy(() => import("../components/pages/application-modules/application/chat/chat"));
const Contacts = lazy(() => import("../components/pages/application-modules/application/contacts/contacts"));
const Email = lazy(() => import("../components/pages/application-modules/application/email/email"));
const FileManager = lazy(() => import("../components/pages/application-modules/application/file-manager/fileManager"));
const AddInoivce = lazy(() => import("../components/pages/application-modules/application/invoice/add-invoice/addInoivce"));
const Invoice = lazy(() => import("../components/pages/application-modules/application/invoice/invoice"));
const KanbanView = lazy(() => import("../components/pages/application-modules/application/kanban-view/kanbanView"));
const Notifications = lazy(() => import("../components/pages/application-modules/application/notifications/notifications"));
const SearchList = lazy(() => import("../components/pages/application-modules/application/search-list/searchList"));
const SocialFeed = lazy(() => import("../components/pages/application-modules/application/social-feed/socialFeed"));
const TodoList = lazy(() => import("../components/pages/application-modules/application/todo/todoList"));
const Notes = lazy(() => import("../components/pages/application-modules/application/notes/notes"));
const InvoiceDetails = lazy(() => import("../components/pages/application-modules/invoice-details/invoiceDetails"));
const Activities = lazy(() => import("../components/pages/clinic-modules/activities/activities"));
const AddDoctor = lazy(() => import("../components/pages/clinic-modules/add-doctor/addDoctor"));
const AppointmentCalendar = lazy(() => import("../components/pages/clinic-modules/appointment-calendar/appointmentCalendar"));
const AppointmentConsultations = lazy(() => import("../components/pages/clinic-modules/appointment-consultations/appointmentConsultations"));
const ConsultationsList = lazy(() => import("../components/pages/clinic-modules/appointments/consultations"));
const Appointments = lazy(() => import("../components/pages/clinic-modules/appointments/appointments"));
const Assets = lazy(() => import("../components/pages/clinic-modules/assets/assets"));
const CreatePatient = lazy(() => import("../components/pages/clinic-modules/create-patient/createPatient"));
const DoctorDetails = lazy(() => import("../components/pages/clinic-modules/doctor-details/doctorDetails"));
const DoctorsList = lazy(() => import("../components/pages/clinic-modules/doctors-list/doctorsList"));
const Doctors = lazy(() => import("../components/pages/clinic-modules/doctors/doctors"));
const EditDoctor = lazy(() => import("../components/pages/clinic-modules/edit-doctor/editDoctor"));
const EditPatient = lazy(() => import("../components/pages/clinic-modules/edit-patient/editPatient"));
const Locations = lazy(() => import("../components/pages/clinic-modules/locations/locations"));
const Messages = lazy(() => import("../components/pages/clinic-modules/messages/messages"));
const NewAppointment = lazy(() => import("../components/pages/clinic-modules/new-appointment/newAppointment"));
const EditAppointment = lazy(() => import("../components/pages/clinic-modules/edit-appointment/editAppointment"));
const PatientDetails = lazy(() => import("../components/pages/clinic-modules/patient-details/patientDetails"));
const PatientsGrid = lazy(() => import("../components/pages/clinic-modules/patients-grid/patientsGrid"));
const Patients = lazy(() => import("../components/pages/clinic-modules/patients/patients"));
const Services = lazy(() => import("../components/pages/clinic-modules/services/services"));
const Specializations = lazy(() => import("../components/pages/clinic-modules/specializations/specializations"));

// Therapy Imports
const TherapistsList = lazy(() => import("../components/pages/therapy-modules/TherapistsList"));
const TherapyCategories = lazy(() => import("../components/pages/therapy-modules/TherapyCategories"));
const TherapyServices = lazy(() => import("../components/pages/therapy-modules/TherapyServices"));
const TherapyAppointments = lazy(() => import("../components/pages/therapy-modules/TherapyAppointments"));
const BookTherapyAppointment = lazy(() => import("../components/pages/therapy-modules/BookTherapyAppointment"));
const ConsultationList = lazy(() => import("../components/pages/therapy-modules/ConsultationList"));
const ConsultationForm = lazy(() => import("../components/pages/therapy-modules/ConsultationForm"));
const AddTherapist = lazy(() => import("../components/pages/therapy-modules/AddTherapist"));
const AddService = lazy(() => import("../components/pages/therapy-modules/AddService"));
const SessionsList = lazy(() => import("../components/pages/therapy-modules/SessionsList"));
const SessionCalendar = lazy(() => import("../components/pages/therapy-modules/SessionCalendar"));
const BillingList = lazy(() => import("../components/pages/therapy-modules/BillingList"));
const ReportsView = lazy(() => import("../components/pages/therapy-modules/ReportsView"));
const AddBlog = lazy(() => import("../components/pages/content-modules/add-blog/addBlog"));
const AddPages = lazy(() => import("../components/pages/content-modules/add-page/addPages"));
const BlogCategories = lazy(() => import("../components/pages/content-modules/blog-categories/blogCategories"));
const BlogComments = lazy(() => import("../components/pages/content-modules/blog-comments/blogComments"));
const Blogs = lazy(() => import("../components/pages/content-modules/blogs/blogs"));
const Cities = lazy(() => import("../components/pages/content-modules/cities/cities"));
const Countries = lazy(() => import("../components/pages/content-modules/countries/countries"));
const EditBlog = lazy(() => import("../components/pages/content-modules/edit-blog/editBlog"));
const EditPage = lazy(() => import("../components/pages/content-modules/edit-page/editPage"));
const Faq = lazy(() => import("../components/pages/content-modules/faq/faq"));
const Pages = lazy(() => import("../components/pages/content-modules/page/pages"));
const States = lazy(() => import("../components/pages/content-modules/states/states"));
const Testimonials = lazy(() => import("../components/pages/content-modules/testimonials/testimonials"));
const Dashboard = lazy(() => import("../components/pages/dashboard/dashboard"));
const DoctorDahboard = lazy(() => import("../components/pages/dashboard/doctor-dashboard/doctorDahboard"));
const PatientDashboard = lazy(() => import("../components/pages/dashboard/patient-dashboard/patientDashboard"));
const PathlabDashboard = lazy(() => import("../components/pages/dashboard/pathlab-dashboard/pathlabDashboard"));
const CategoryManagement = lazy(() => import("../components/pages/dashboard/pathlab-dashboard/categoryManagement"));
const DiagnosticTestManagement = lazy(() => import("../components/pages/dashboard/pathlab-dashboard/testManagement"));
const DiagnosticBooking = lazy(() => import("../components/pages/dashboard/pathlab-dashboard/diagnosticBooking"));
const InvoiceManagement = lazy(() => import("../components/pages/dashboard/pathlab-dashboard/invoiceManagement"));
const PharmacyDashboard = lazy(() => import("../components/pages/dashboard/pharmacy-dashboard/pharmacyDashboard"));
const PharmacyCategoryManagement = lazy(() => import("../components/pages/dashboard/pharmacy-dashboard/pharmacyCategoryManagement"));
const MedicineManagement = lazy(() => import("../components/pages/dashboard/pharmacy-dashboard/medicineManagement"));
const InventoryManagement = lazy(() => import("../components/pages/dashboard/pharmacy-dashboard/inventoryManagement"));
const PharmacyBilling = lazy(() => import("../components/pages/dashboard/pharmacy-dashboard/pharmacyBilling"));
const SalesHistory = lazy(() => import("../components/pages/dashboard/pharmacy-dashboard/salesHistory"));
const DoctorAppointments = lazy(() => import("../components/pages/doctor-modules/doctor-appointments/doctorAppointments"));
const DoctorsAppointmentDetails = lazy(() => import("../components/pages/doctor-modules/doctors-appointment-details/doctorsAppointmentDetails"));
const DoctorsLeaves = lazy(() => import("../components/pages/doctor-modules/doctors-leaves/doctorsLeaves"));
const DoctorsNotificationSettings = lazy(() => import("../components/pages/doctor-modules/doctors-notification-settings/doctorsNotificationSettings"));
const DoctorsPasswordSettings = lazy(() => import("../components/pages/doctor-modules/doctors-password-settings/doctorsPasswordSettings"));
const DoctorsPrescriptionDetails = lazy(() => import("../components/pages/doctor-modules/doctors-prescription-details/doctorsPrescriptionDetails"));
const DoctorsPrescriptions = lazy(() => import("../components/pages/doctor-modules/doctors-prescriptions/doctorsPrescriptions"));
const DoctorsProfileSettings = lazy(() => import("../components/pages/doctor-modules/doctors-profile-settings/doctorsProfileSettings"));
const DoctorsReviews = lazy(() => import("../components/pages/doctor-modules/doctors-reviews/doctorsReviews"));
const DoctorSchedules = lazy(() => import("../components/pages/doctor-modules/doctors-schedules/doctorSchedules"));
const OnlineConsultations = lazy(() => import("../components/pages/doctor-modules/online-consultations/onlineConsultations"));
const MyPatients = lazy(() => import("../components/pages/doctor-modules/my-patients/MyPatients"));
const MyAttendance = lazy(() => import("../components/pages/doctor-modules/my-attendance/MyAttendance"));
const ExpenseCategory = lazy(() => import("../components/pages/finance-accounts-module/expenses/expenseCategory"));
const ExpensesList = lazy(() => import("../components/pages/finance-accounts-module/expenses/expenses"));
const IncomeList = lazy(() => import("../components/pages/finance-accounts-module/income"));
const AddInvoices = lazy(() => import("../components/pages/finance-accounts-module/invoices/addInvoices"));
const EditInvoices = lazy(() => import("../components/pages/finance-accounts-module/invoices/editInvoices"));
const InvoicesList = lazy(() => import("../components/pages/finance-accounts-module/invoices/invoices"));
const InvoicesDetails = lazy(() => import("../components/pages/finance-accounts-module/invoices/invoicesDetails"));
const PaymentsList = lazy(() => import("../components/pages/finance-accounts-module/payments"));
const TransactionsList = lazy(() => import("../components/pages/finance-accounts-module/transactions"));
const AttendanceList = lazy(() => import("../components/pages/hrm-modules/attendance"));
const DesignationList = lazy(() => import("../components/pages/hrm-modules/designation"));
const HolidaysList = lazy(() => import("../components/pages/hrm-modules/holidays"));
const HrmDepartments = lazy(() => import("../components/pages/hrm-modules/hrmDepartments"));
const LeavesList = lazy(() => import("../components/pages/hrm-modules/leaves/leavesList"));
const LeaveType = lazy(() => import("../components/pages/hrm-modules/leaves/leaveType"));
const PayrollList = lazy(() => import("../components/pages/hrm-modules/payroll"));
const PayrollTwo = lazy(() => import("../components/pages/hrm-modules/payrollTwo"));
const StaffsList = lazy(() => import("../components/pages/hrm-modules/staffs"));
const Gallery = lazy(() => import("../components/pages/pages-module/gallery"));
const Profile = lazy(() => import("../components/pages/pages-module/profile"));
const Starter = lazy(() => import("../components/pages/pages-module/starter"));
const Timeline = lazy(() => import("../components/pages/pages-module/timeline"));
const ComingSoon = lazy(() => import("../components/pages/pages-modules/coming-soon/comingSoon"));
const Pricing = lazy(() => import("../components/pages/pages-modules/pricing/pricing"));
const PrivacyPolicy = lazy(() => import("../components/pages/pages-modules/privacy-policy/privacyPolicy"));
const UnderMaintenance = lazy(() => import("../components/pages/pages-modules/under-maintenance/underMaintenance"));
const PatientAppointmentDetails = lazy(() => import("../components/pages/patient-modules/patient-appointment-details/patientAppointmentDetails"));
const PatientAppointments = lazy(() => import("../components/pages/patient-modules/patient-appointments/patientAppointments"));
const PatientDoctors = lazy(() => import("../components/pages/patient-modules/patient-doctors/patientDoctors"));
const PatientInvoiceDetails = lazy(() => import("../components/pages/patient-modules/patient-invoice-details/patientInvoiceDetails"));
const PatientInvoices = lazy(() => import("../components/pages/patient-modules/patient-invoices/patientInvoices"));
const PatientNotificationsSettings = lazy(() => import("../components/pages/patient-modules/patient-notifications-settings/patientNotificationsSettings"));
const PatientPasswordSettings = lazy(() => import("../components/pages/patient-modules/patient-password-settings/patientPasswordSettings"));
const PatientPrescriptionDetails = lazy(() => import("../components/pages/patient-modules/patient-prescription-details/patientPrescriptionDetails"));
const PatientPrescriptions = lazy(() => import("../components/pages/patient-modules/patient-prescriptions/patientPrescriptions"));
const PatientProfileSettings = lazy(() => import("../components/pages/patient-modules/patient-profile-settings/patientProfileSettings"));
const PatientClinics = lazy(() => import("../components/pages/patient-modules/patient-clinics/patientClinics"));
const IntegrationsSettings = lazy(() => import("../components/pages/settings-modules/account-settings/integrations-settings/integrationsSettings"));
const NotificationsSettings = lazy(() => import("../components/pages/settings-modules/account-settings/notifications-settings/notificationsSettings"));
const ProfileSettings = lazy(() => import("../components/pages/settings-modules/account-settings/profile-settings/profileSettings"));
const SecuritySettings = lazy(() => import("../components/pages/settings-modules/account-settings/security-settings/securitySettings"));
const SignaturesSettings = lazy(() => import("../components/pages/settings-modules/app-settings/signaturesSettings"));
const AppointmentSettings = lazy(() => import("../components/pages/settings-modules/clinic-settings/appointment-settings/appointmentSettings"));
const CancellationReasonSettings = lazy(() => import("../components/pages/settings-modules/clinic-settings/cancellation-reason-settings/cancellationReasonSettings"));
const CustomFieldsSettings = lazy(() => import("../components/pages/settings-modules/clinic-settings/custom-fields-settings/customFieldsSettings"));
const InvoiceSettings = lazy(() => import("../components/pages/settings-modules/clinic-settings/invoice-settings/invoiceSettings"));
const InvoiceTemplatesSettings = lazy(() => import("../components/pages/settings-modules/clinic-settings/invoice-templates-settings/invoiceTemplatesSettings"));
const WorkingHoursSettings = lazy(() => import("../components/pages/settings-modules/clinic-settings/working-hours-settings/workingHoursSettings"));
const BankAccountsSettings = lazy(() => import("../components/pages/settings-modules/finance-settings/bank-accounts-settings/bankAccountsSettings"));
const CurrenciesSettings = lazy(() => import("../components/pages/settings-modules/finance-settings/currencies-settings/currenciesSettings"));
const PaymentMethodsSettings = lazy(() => import("../components/pages/settings-modules/finance-settings/payment-methods-settings/paymentMethodsSettings"));
const TaxRatesSettings = lazy(() => import("../components/pages/settings-modules/finance-settings/tax-rates-settings/taxRatesSettings"));
const BanIpAddressSettings = lazy(() => import("../components/pages/settings-modules/other-settings/ban-ip-address-settings/banIpAddressSettings"));
const ClearCacheSettings = lazy(() => import("../components/pages/settings-modules/other-settings/clear-cache-settings/clearCacheSettings"));
const CronjobSettings = lazy(() => import("../components/pages/settings-modules/other-settings/cronjob-settings/cronjobSettings"));
const DatabaseBackupSettings = lazy(() => import("../components/pages/settings-modules/other-settings/database-backup-settings/databaseBackupSettings"));
const SitemapSettings = lazy(() => import("../components/pages/settings-modules/other-settings/sitemap-settings/sitemapSettings"));
const StorageSettings = lazy(() => import("../components/pages/settings-modules/other-settings/storage-settings/storageSettings"));
const SystemBackupSettings = lazy(() => import("../components/pages/settings-modules/other-settings/system-backup-settings/systemBackupSettings"));
const SystemUpdate = lazy(() => import("../components/pages/settings-modules/other-settings/system-update/systemUpdate"));
const EmailSettings = lazy(() => import("../components/pages/settings-modules/system-settings/email-settings/emailSettings"));
const EmailTemplatesSettings = lazy(() => import("../components/pages/settings-modules/system-settings/email-templates-settings/emailTemplatesSettings"));
const GdprCookiesSettings = lazy(() => import("../components/pages/settings-modules/system-settings/gdpr-cookies-settings/gdprCookiesSettings"));
const SmsGatewaysSettings = lazy(() => import("../components/pages/settings-modules/system-settings/sms-gateways-settings/smsGatewaysSettings"));
const SmsTemplatesSettings = lazy(() => import("../components/pages/settings-modules/system-settings/sms-templates-settings/smsTemplatesSettings"));
const LanguageSettings = lazy(() => import("../components/pages/settings-modules/website-settings/language-settings/languageSettings"));
const LanguageSettings2 = lazy(() => import("../components/pages/settings-modules/website-settings/language-settings2/languageSettings2"));
const LanguageSettings3 = lazy(() => import("../components/pages/settings-modules/website-settings/language-settings3/languageSettings3"));
const LocalizationSettings = lazy(() => import("../components/pages/settings-modules/website-settings/localization-settings/localizationSettings"));
const LoginAndRegisterSettings = lazy(() => import("../components/pages/settings-modules/website-settings/login-and-register-settings/loginAndRegisterSettings"));
const MaintenanceModeSettings = lazy(() => import("../components/pages/settings-modules/website-settings/maintenance-mode-settings/maintenanceModeSettings"));
const OrganizationSettings = lazy(() => import("../components/pages/settings-modules/website-settings/organization-settings/organizationSettings"));
const PreferencesSettings = lazy(() => import("../components/pages/settings-modules/website-settings/preferences-settings/preferencesSettings"));
const PrefixesSettings = lazy(() => import("../components/pages/settings-modules/website-settings/prefixes-settings/prefixesSettings"));
const SeoSetupSettings = lazy(() => import("../components/pages/settings-modules/website-settings/seo-setup-settings/seoSetupSettings"));
const AnnouncementsList = lazy(() => import("../components/pages/support-modules/announcements"));
const ContactMessages = lazy(() => import("../components/pages/support-modules/contactMessages"));
const Newsletters = lazy(() => import("../components/pages/support-modules/newsletters"));
const TicketDetails = lazy(() => import("../components/pages/support-modules/ticketDetails"));
const TicketsList = lazy(() => import("../components/pages/support-modules/tickets"));
const UiAccordion = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiAccordion"));
const UiAlerts = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiAlerts"));
const UiAvatar = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiAvatar"));
const UiBadges = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiBadges"));
const UiBreadcrumb = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiBreadcrumb"));
const UiButtons = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiButtons"));
const UiButtonsGroup = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiButtonsGroup"));
const UiCards = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiCards"));
const UiCarousel = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiCarousel"));
const UiCollapse = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiCollapse"));
const UiDropdowns = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiDropdowns"));
const UiGrid = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiGrid"));
const UiImages = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiImages"));
const UiLinks = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiLinks"));
const UiListGroup = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiListGroup"));
const UiModals = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiModals"));
const UiNavTabs = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiNavTabs"));
const UiOffcanvas = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiOffcanvas"));
const UiPagination = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiPagination"));
const UiPlaceholders = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiPlaceholders"));
const UiPopovers = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiPopovers"));
const UiProgress = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiProgress"));
const UiRatio = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiRatio"));
const UiScrollspy = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiScrollspy"));
const UiSpinner = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiSpinner"));
const UiToasts = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiToasts"));
const UiTooltips = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiTooltips"));
const UiTypography = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiTypography"));
const UiUtilities = lazy(() => import("../components/pages/ui-modules/ui-interface/base-ui/uiUtilities"));
const ChartApex = lazy(() => import("../components/pages/ui-modules/ui-interface/charts/apexcharts"));
const ChartJSExample = lazy(() => import("../components/pages/ui-modules/ui-interface/charts/chartjs"));
const FormBasicInputs = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-elements/formBasicInputs"));
const FormCheckboxRadios = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-elements/formCheckboxRadios"));
const FormFileupload = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-elements/formFileupload"));
const FormGridGutters = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-elements/formGridGutters"));
const FormInputGroups = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-elements/formInputGroups"));
const FormFloatingLabels = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-layouts/formFloatingLabels"));
const FormHorizontal = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-layouts/formHorizontal"));
const FormVertical = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-layouts/formVertical"));
const FormPickers = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-pickers/formPickers"));
const FormSelect2 = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-select2/formSelect2"));
const FormValidation = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-validation/formValidation"));
const FormWizard = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/form-wizard/formWizard"));
const FormMask = lazy(() => import("../components/pages/ui-modules/ui-interface/forms/input-masks/inputMasks"));
const IconBootstrap = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconBootstrap"));
const IconFlag = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconFlag"));
const IconFontawesome = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconFontawesome"));
const IconIonic = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconIonic"));
const IconMaterial = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconMaterial"));
const IconPe7 = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconPe7"));
const IconRemix = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconRemix"));
const IconTabler = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconTabler"));
const IconThemify = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconThemify"));
const IconTypicon = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconTypicon"));
const IconWeather = lazy(() => import("../components/pages/ui-modules/ui-interface/icons/iconWeather"));
const MapsLeaflet = lazy(() => import("../components/pages/ui-modules/ui-interface/map/leaflet"));
const DataTables = lazy(() => import("../components/pages/ui-modules/ui-interface/table/data-tables"));
const TablesBasic = lazy(() => import("../components/pages/ui-modules/ui-interface/table/tables-basic"));
const UiDragula = lazy(() => import("../components/pages/ui-modules/ui-interface/ui-advance/dragula/dragula"));
const UiClipBoard = lazy(() => import("../components/pages/ui-modules/ui-interface/ui-advance/uiClipboard"));
const UiCounter = lazy(() => import("../components/pages/ui-modules/ui-interface/ui-advance/uiCounter"));
const UiLightboxes = lazy(() => import("../components/pages/ui-modules/ui-interface/ui-advance/uiLightbox"));
const UiRangeSlides = lazy(() => import("../components/pages/ui-modules/ui-interface/ui-advance/uiRangeslider"));
const UiRating = lazy(() => import("../components/pages/ui-modules/ui-interface/ui-advance/uiRating"));
const UiScrollbar = lazy(() => import("../components/pages/ui-modules/ui-interface/ui-advance/uiScrollbar"));
import { all_routes } from "./all_routes";
import { Route } from "react-router";

const AppointmentDetails = lazy(() => import("../components/pages/clinic-modules/appointments/appointmentDetails"));
const SuperAdminDashboard = lazy(() => import("../components/pages/super-admin/super-admin-dashboard/superAdminDashboard"));

const routes = all_routes;

export const publicRoutes = [
  {
    path: routes.packages,
    element: <PackagesAdmin />,
    route: Route,
  },
  {
    path: routes.appointmentDetails,
    element: <AppointmentDetails />,
    route: Route,
  },
  {
    path: routes.demoBookings,
    element: <DemoBookingsAdmin />,
    route: Route,
  },
  {
    path: routes.tenants,
    element: <TenantsAdmin />,
    route: Route,
  },
  {
    path: routes.dashboard,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.pathlabDashboard,
    element: <PathlabDashboard />,
    route: Route,
  },
  {
    path: routes.pathlabCategories,
    element: <CategoryManagement />,
    route: Route,
  },
  {
    path: routes.pathlabTests,
    element: <DiagnosticTestManagement />,
    route: Route,
  },
  {
    path: routes.pathlabBookings,
    element: <DiagnosticBooking />,
    route: Route,
  },
  {
    path: routes.pathlabInvoices,
    element: <InvoiceManagement />,
    route: Route,
  },
  {
    path: routes.pharmacyDashboard,
    element: <PharmacyDashboard />,
    route: Route,
  },
  {
    path: routes.pharmacyCategories,
    element: <PharmacyCategoryManagement />,
    route: Route,
  },
  {
    path: routes.pharmacyMedicines,
    element: <MedicineManagement />,
    route: Route,
  },
  {
    path: routes.pharmacyInventory,
    element: <InventoryManagement />,
    route: Route,
  },
  {
    path: routes.pharmacyBilling,
    element: <PharmacyBilling />,
    route: Route,
  },
  {
    path: routes.pharmacySalesHistory,
    element: <SalesHistory />,
    route: Route,
  },
  {
    path: routes.layoutDefault,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.layoutMini,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.layoutHoverView,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.layoutHidden,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.layoutFullWidth,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.layoutRTL,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.layoutDark,
    element: <Dashboard />,
    route: Route,
  },
  {
    path: routes.doctordashboard,
    element: <DoctorDahboard />,
    route: Route,
  },
  {
    path: routes.doctorsappointments,
    element: <DoctorAppointments />,
    route: Route,
  },
  {
    path: routes.doctorsappointmentdetails,
    element: <DoctorsAppointmentDetails />,
    route: Route,
  },
  {
    path: routes.onlineconsultations,
    element: <OnlineConsultations />,
    route: Route,
  },
  {
    path: routes.doctorschedule,
    element: <DoctorSchedules />,
    route: Route,
  },
  {
    path: routes.doctorsprescriptions,
    element: <DoctorsPrescriptions />,
    route: Route,
  },
  {
    path: routes.doctorsprescriptiondetails,
    element: <DoctorsPrescriptionDetails />,
    route: Route,
  },
  {
    path: routes.doctorleaves,
    element: <DoctorsLeaves />,
    route: Route,
  },
  {
    path: routes.doctorreviews,
    element: <DoctorsReviews />,
    route: Route,
  },
  {
    path: routes.doctorsprofilesettings,
    element: <DoctorsProfileSettings />,
    route: Route,
  },
  {
    path: routes.doctorspasswordsettings,
    element: <DoctorsPasswordSettings />,
    route: Route,
  },
  {
    path: routes.doctorPatients,
    element: <MyPatients />,
    route: Route,
  },
  {
    path: routes.doctorAttendance,
    element: <MyAttendance />,
    route: Route,
  },
  {
    path: routes.doctorsnotificationsettings,
    element: <DoctorsNotificationSettings />,
    route: Route,
  },
  {
    path: all_routes.privacyPolicyAdmin,
    name: "privacy-policy-admin",
    element: <PrivacyPolicyAdmin />,
    route: Route,
  },
  {
    path: all_routes.termsConditionAdmin,
    name: "terms-conditions-admin",
    element: <TermsConditionAdmin />,
    route: Route,
  },
  {
    path: all_routes.refundPolicyAdmin,
    name: "refund-policy-admin",
    element: <RefundPolicyAdmin />,
    route: Route,
  },
  {
    path: all_routes.contactSettingsAdmin,
    name: "contact-settings-admin",
    element: <ContactSettingsAdmin />,
    route: Route,
  },
  {
    path: all_routes.superAdminEmailSettings,
    name: "super-admin-email-settings",
    element: <EmailSettingsAdmin />,
    route: Route,
  },
  {
    path: all_routes.superAdminRazorpaySettings,
    name: "super-admin-razorpay-settings",
    element: <RazorpaySettingsAdmin />,
    route: Route,
  },
  {
    path: routes.superAdminDashboard,
    name: "super-admin-dashboard",
    element: <SuperAdminDashboard />,
    route: Route,
  },
  {
    path: routes.patientdashboard,
    element: <PatientDashboard />,
    route: Route,
  },
  {
    path: routes.patientappointments,
    element: <PatientAppointments />,
    route: Route,
  },
  {
    path: routes.patientappointmentdetails,
    element: <PatientAppointmentDetails />,
    route: Route,
  },
  {
    path: routes.patientdoctors,
    element: <PatientDoctors />,
    route: Route,
  },
  {
    path: routes.patientPrescriptions,
    element: <PatientPrescriptions />,
    route: Route,
  },
  {
    path: routes.patientprescriptiondetails,
    element: <PatientPrescriptionDetails />,
    route: Route,
  },
  {
    path: routes.patientinvoices,
    element: <PatientInvoices />,
    route: Route,
  },
  {
    path: routes.patientinvoicedetails,
    element: <PatientInvoiceDetails />,
    route: Route,
  },
  {
    path: routes.patientprofilesettings,
    element: <PatientProfileSettings />,
    route: Route,
  },
  {
    path: routes.patientpasswordsettings,
    element: <PatientPasswordSettings />,
    route: Route,
  },
  {
    path: routes.patientnotificationssettings,
    element: <PatientNotificationsSettings />,
    route: Route,
  },
  {
    path: routes.patientclinics,
    element: <PatientClinics />,
    route: Route,
  },
  {
    path: routes.patientdoctordetails,
    element: <DoctorDetails />,
    route: Route,
  },
  {
    path: routes.chat,
    element: <Chat />,
    route: Route,
  },
  {
    path: routes.voiceCall,
    element: <VoiceCalls />,
    route: Route,
  },
  {
    path: routes.videoCall,
    element: <VideoCall />,
    route: Route,
  },
  {
    path: routes.outgoingCall,
    element: <OutGoingCall />,
    route: Route,
  },
  {
    path: routes.incomingCall,
    element: <IncomingCall />,
    route: Route,
  },
  {
    path: routes.callHistory,
    element: <CallHistory />,
    route: Route,
  },
  {
    path: routes.calendar,
    element: <Calendars />,
    route: Route,
  },
  {
    path: routes.email,
    element: <Email />,
    route: Route,
  },
  {
    path: routes.todo,
    element: <TodoList />,
    route: Route,
  },
  {
    path: routes.todoList,
    element: <TodoList />,
    route: Route,
  },
  {
    path: routes.notes,
    element: <Notes />,
    route: Route,
  },
  {
    path: routes.socialFeed,
    element: <SocialFeed />,
    route: Route,
  },
  {
    path: routes.fileManager,
    element: <FileManager />,
    route: Route,
  },
  {
    path: routes.kanbanView,
    element: <KanbanView />,
    route: Route,
  },
  {
    path: routes.contacts,
    element: <Contacts />,
    route: Route,
  },
  {
    path: routes.invoice,
    element: <Invoice />,
    route: Route,
  },
  {
    path: routes.invoiceDetails,
    element: <InvoiceDetails />,
    route: Route,
  },
  {
    path: routes.searchList,
    element: <SearchList />,
    route: Route,
  },
  {
    path: routes.doctors,
    element: <Doctors />,
    route: Route,
  },
  {
    path: routes.doctorsList,
    element: <DoctorsList />,
    route: Route,
  },
  {
    path: routes.editDoctors,
    element: <EditDoctor />,
    route: Route,
  },
  {
    path: routes.addDoctors,
    element: <AddDoctor />,
    route: Route,
  },
  {
    path: routes.doctorsDetails,
    element: <DoctorDetails />,
    route: Route,
  },
  {
    path: routes.patients,
    element: <Patients />,
    route: Route,
  },
  {
    path: routes.patientsGrid,
    element: <PatientsGrid />,
    route: Route,
  },
  {
    path: routes.createPatient,
    element: <CreatePatient />,
    route: Route,
  },
  {
    path: routes.editPatient,
    element: <EditPatient />,
    route: Route,
  },
  {
    path: routes.patientDetails,
    element: <PatientDetails />,
    route: Route,
  },
  {
    path: routes.uiAccordion,
    element: <UiAccordion />,
    route: Route,
  },
  {
    path: routes.uiAlerts,
    element: <UiAlerts />,
    route: Route,
  },
  {
    path: routes.uiAvatar,
    element: <UiAvatar />,
    route: Route,
  },
  {
    path: routes.uiBadges,
    element: <UiBadges />,
    route: Route,
  },
  {
    path: routes.uiBreadcrumb,
    element: <UiBreadcrumb />,
    route: Route,
  },
  {
    path: routes.uiButtons,
    element: <UiButtons />,
    route: Route,
  },
  {
    path: routes.uiButtonsGroup,
    element: <UiButtonsGroup />,
    route: Route,
  },
  {
    path: routes.uiCards,
    element: <UiCards />,
    route: Route,
  },
  {
    path: routes.uiCarousel,
    element: <UiCarousel />,
    route: Route,
  },
  {
    path: routes.uiCollapse,
    element: <UiCollapse />,
    route: Route,
  },
  {
    path: routes.uiDropdowns,
    element: <UiDropdowns />,
    route: Route,
  },
  {
    path: routes.uiRatio,
    element: <UiRatio />,
    route: Route,
  },
  {
    path: routes.uiGrid,
    element: <UiGrid />,
    route: Route,
  },
  {
    path: routes.uiImages,
    element: <UiImages />,
    route: Route,
  },
  {
    path: routes.uiLinks,
    element: <UiLinks />,
    route: Route,
  },
  {
    path: routes.uiListGroup,
    element: <UiListGroup />,
    route: Route,
  },
  {
    path: routes.uiModals,
    element: <UiModals />,
    route: Route,
  },
  {
    path: routes.uiOffcanvas,
    element: <UiOffcanvas />,
    route: Route,
  },
  {
    path: routes.uiPagination,
    element: <UiPagination />,
    route: Route,
  },
  {
    path: routes.uiPlaceholders,
    element: <UiPlaceholders />,
    route: Route,
  },
  {
    path: routes.uiPopovers,
    element: <UiPopovers />,
    route: Route,
  },
  {
    path: routes.uiProgress,
    element: <UiProgress />,
    route: Route,
  },
  {
    path: routes.uiScrollspy,
    element: <UiScrollspy />,
    route: Route,
  },
  {
    path: routes.uiSpinner,
    element: <UiSpinner />,
    route: Route,
  },
  {
    path: routes.uiNavTabs,
    element: <UiNavTabs />,
    route: Route,
  },
  {
    path: routes.uiToasts,
    element: <UiToasts />,
    route: Route,
  },
  {
    path: routes.uiTooltips,
    element: <UiTooltips />,
    route: Route,
  },
  {
    path: routes.uiTypography,
    element: <UiTypography />,
    route: Route,
  },
  {
    path: routes.uiUtilities,
    element: <UiUtilities />,
    route: Route,
  },
  {
    path: routes.uiDraggble,
    element: <UiDragula />,
    route: Route,
  },
  {
    path: routes.uiClipboard,
    element: <UiClipBoard />,
    route: Route,
  },
  {
    path: routes.uiRangeslider,
    element: <UiRangeSlides />,
    route: Route,
  },
  {
    path: routes.uiLightbox,
    element: <UiLightboxes />,
    route: Route,
  },
  {
    path: routes.uiRating,
    element: <UiRating />,
    route: Route,
  },
  {
    path: routes.uiCounter,
    element: <UiCounter />,
    route: Route,
  },
  {
    path: routes.uiScrollbar,
    element: <UiScrollbar />,
    route: Route,
  },
  {
    path: routes.chartApex,
    element: <ChartApex />,
    route: Route,
  },
  {
    path: routes.chartJs,
    element: <ChartJSExample />,
    route: Route,
  },
  {
    path: routes.mapsLeaflet,
    element: <MapsLeaflet />,
    route: Route,
  },
  {
    path: routes.tablesBasic,
    element: <TablesBasic />,
    route: Route,
  },
  {
    path: routes.dataTables,
    element: <DataTables />,
    route: Route,
  },
  {
    path: routes.iconFontawesome,
    element: <IconFontawesome />,
    route: Route,
  },
  {
    path: routes.iconTabler,
    element: <IconTabler />,
    route: Route,
  },
  {
    path: routes.iconBootstrap,
    element: <IconBootstrap />,
    route: Route,
  },
  {
    path: routes.iconRemix,
    element: <IconRemix />,
    route: Route,
  },
  {
    path: routes.iconIonic,
    element: <IconIonic />,
    route: Route,
  },
  {
    path: routes.iconMaterial,
    element: <IconMaterial />,
    route: Route,
  },
  {
    path: routes.iconPe7,
    element: <IconPe7 />,
    route: Route,
  },
  {
    path: routes.iconThemify,
    element: <IconThemify />,
    route: Route,
  },
  {
    path: routes.iconWeather,
    element: <IconWeather />,
    route: Route,
  },
  {
    path: routes.iconTypicon,
    element: <IconTypicon />,
    route: Route,
  },
  {
    path: routes.iconFlag,
    element: <IconFlag />,
    route: Route,
  },
  {
    path: routes.formBasicInputs,
    element: <FormBasicInputs />,
    route: Route,
  },
  {
    path: routes.formCheckboxRadios,
    element: <FormCheckboxRadios />,
    route: Route,
  },
  {
    path: routes.formInputGroups,
    element: <FormInputGroups />,
    route: Route,
  },
  {
    path: routes.formGridGutters,
    element: <FormGridGutters />,
    route: Route,
  },
  {
    path: routes.formFileupload,
    element: <FormFileupload />,
    route: Route,
  },
  {
    path: routes.formHorizontal,
    element: <FormHorizontal />,
    route: Route,
  },
  {
    path: routes.formVertical,
    element: <FormVertical />,
    route: Route,
  },
  {
    path: routes.formFloatingLabels,
    element: <FormFloatingLabels />,
    route: Route,
  },
  {
    path: routes.formValidation,
    element: <FormValidation />,
    route: Route,
  },
  {
    path: routes.formSelect2,
    element: <FormSelect2 />,
    route: Route,
  },
  {
    path: routes.formPickers,
    element: <FormPickers />,
    route: Route,
  },
  {
    path: routes.formMask,
    element: <FormMask />,
    route: Route,
  },
  {
    path: routes.formWizard,
    element: <FormWizard />,
    route: Route,
  },
  {
    path: routes.profilesettings,
    element: <ProfileSettings />,
    route: Route,
  },
  {
    path: routes.securitysettings,
    element: <SecuritySettings />,
    route: Route,
  },
  {
    path: routes.notificationssettings,
    element: <NotificationsSettings />,
    route: Route,
  },
  {
    path: routes.integrationssettings,
    element: <IntegrationsSettings />,
    route: Route,
  },
  {
    path: routes.organizationsettings,
    element: <OrganizationSettings />,
    route: Route,
  },
  {
    path: routes.localizationsettings,
    element: <LocalizationSettings />,
    route: Route,
  },
  {
    path: routes.prefixessettings,
    element: <PrefixesSettings />,
    route: Route,
  },
  {
    path: routes.seosetupsettings,
    element: <SeoSetupSettings />,
    route: Route,
  },
  {
    path: routes.languagesettings,
    element: <LanguageSettings />,
    route: Route,
  },
  {
    path: routes.languagesettings2,
    element: <LanguageSettings2 />,
    route: Route,
  },
  {
    path: routes.languagesettings3,
    element: <LanguageSettings3 />,
    route: Route,
  },
  {
    path: routes.maintenancemodesettings,
    element: <MaintenanceModeSettings />,
    route: Route,
  },
  {
    path: routes.loginandregistersettings,
    element: <LoginAndRegisterSettings />,
    route: Route,
  },
  {
    path: routes.preferencessettings,
    element: <PreferencesSettings />,
    route: Route,
  },
  {
    path: routes.appointmentsettings,
    element: <AppointmentSettings />,
    route: Route,
  },
  {
    path: routes.workinghourssettings,
    element: <WorkingHoursSettings />,
    route: Route,
  },
  {
    path: routes.cancellationreasonsettings,
    element: <CancellationReasonSettings />,
    route: Route,
  },
  {
    path: routes.invoicesettings,
    element: <InvoiceSettings />,
    route: Route,
  },
  {
    path: routes.invoicetemplatessettings,
    element: <InvoiceTemplatesSettings />,
    route: Route,
  },
  {
    path: routes.emailsettings,
    element: <EmailSettings />,
    route: Route,
  },
  {
    path: routes.emailtemplatessettings,
    element: <EmailTemplatesSettings />,
    route: Route,
  },
  {
    path: routes.smsgatewayssettings,
    element: <SmsGatewaysSettings />,
    route: Route,
  },
  {
    path: routes.smstemplatessettings,
    element: <SmsTemplatesSettings />,
    route: Route,
  },
  {
    path: routes.gdprcookiessettings,
    element: <GdprCookiesSettings />,
    route: Route,
  },
  {
    path: routes.paymentmethodssettings,
    element: <PaymentMethodsSettings />,
    route: Route,
  },
  {
    path: routes.bankaccountssettings,
    element: <BankAccountsSettings />,
    route: Route,
  },
  {
    path: routes.taxratessettings,
    element: <TaxRatesSettings />,
    route: Route,
  },
  {
    path: routes.currenciessettings,
    element: <CurrenciesSettings />,
    route: Route,
  },
  {
    path: routes.sitemapsettings,
    element: <SitemapSettings />,
    route: Route,
  },
  {
    path: routes.clearcachesettings,
    element: <ClearCacheSettings />,
    route: Route,
  },
  {
    path: routes.storagesettings,
    element: <StorageSettings />,
    route: Route,
  },
  {
    path: routes.cronjobsettings,
    element: <CronjobSettings />,
    route: Route,
  },
  {
    path: routes.systembackupsettings,
    element: <SystemBackupSettings />,
    route: Route,
  },
  {
    path: routes.databasebackupsettings,
    element: <DatabaseBackupSettings />,
    route: Route,
  },
  {
    path: routes.systemupdate,
    element: <SystemUpdate />,
    route: Route,
  },
  {
    path: routes.rolesPermissions,
    element: <RolesAndPermissions />,
    route: Route,
  },
  {
    path: routes.permissions,
    element: <Permissions />,
    route: Route,
  },
  {
    path: routes.deleteaccountrequest,
    element: <DeleteAccountRequest />,
    route: Route,
  },
  {
    path: routes.incomeReport,
    element: <IncomeReport />,
    route: Route,
  },
  {
    path: routes.expenseReport,
    element: <ExpenseReport />,
    route: Route,
  },
  {
    path: routes.profitloss,
    element: <ProfitAndLoss />,
    route: Route,
  },
  {
    path: routes.appointmentReport,
    element: <AppointmentReport />,
    route: Route,
  },
  {
    path: routes.patientReport,
    element: <PatientReport />,
    route: Route,
  },
  {
    path: routes.doctorScheduleClini,
    element: <DoctorSchedules />,
    route: Route,
  },
  {
    path: routes.contactMessages,
    element: <ContactMessages />,
    route: Route,
  },
  {
    path: routes.tickets,
    element: <TicketsList />,
    route: Route,
  },
  {
    path: routes.ticketDetails,
    element: <TicketDetails />,
    route: Route,
  },
  {
    path: routes.announcements,
    element: <AnnouncementsList />,
    route: Route,
  },
  {
    path: routes.newsletters,
    element: <Newsletters />,
    route: Route,
  },
  {
    path: routes.starter,
    element: <Starter />,
    route: Route,
  },
  {
    path: routes.therapistList,
    element: <TherapistsList />,
    route: Route,
  },
  {
    path: routes.therapyCategories,
    element: <TherapyCategories />,
    route: Route,
  },
  {
    path: routes.therapyServices,
    element: <TherapyServices />,
    route: Route,
  },
  {
    path: routes.therapyAppointments,
    element: <TherapyAppointments />,
    route: Route,
  },
  {
    path: routes.bookTherapyAppointment,
    element: <BookTherapyAppointment />,
    route: Route,
  },
  {
    path: routes.therapyConsultations,
    element: <ConsultationList />,
    route: Route,
  },
  {
    path: routes.createConsultation,
    element: <ConsultationForm />,
    route: Route,
  },
  {
    path: routes.consultationDetails,
    element: <ConsultationForm />,
    route: Route,
  },
  {
    path: routes.addTherapist,
    element: <AddTherapist />,
    route: Route,
  },
  {
    path: routes.addService,
    element: <AddService />,
    route: Route,
  },
  {
    path: routes.todaysSessions,
    element: <SessionsList />,
    route: Route,
  },
  {
    path: routes.allSessions,
    element: <SessionsList />,
    route: Route,
  },
  {
    path: routes.sessionCalendar,
    element: <SessionCalendar />,
    route: Route,
  },
  {
    path: routes.sessionHistory,
    element: <SessionsList />,
    route: Route,
  },
  {
    path: routes.therapyBills,
    element: <BillingList />,
    route: Route,
  },
  {
    path: routes.therapyPayments,
    element: <BillingList />,
    route: Route,
  },
  {
    path: routes.therapyAppointmentReport,
    element: <ReportsView />,
    route: Route,
  },
  {
    path: routes.therapySessionReport,
    element: <ReportsView />,
    route: Route,
  },
  {
    path: routes.therapyTherapistReport,
    element: <ReportsView />,
    route: Route,
  },
  {
    path: routes.therapyRevenueReport,
    element: <ReportsView />,
    route: Route,
  },
  {
    path: routes.patientProgressReport,
    element: <ReportsView />,
    route: Route,
  },
  {
    path: routes.profile,
    element: <Profile />,
    route: Route,
  },
  {
    path: routes.timeline,
    element: <Timeline />,
    route: Route,
  },
  {
    path: routes.gallery,
    element: <Gallery />,
    route: Route,
  },
  {
    path: routes.staffs,
    element: <StaffsList />,
    route: Route,
  },
  {
    path: routes.hrmDepartments,
    element: <HrmDepartments />,
    route: Route,
  },
  {
    path: routes.designation,
    element: <DesignationList />,
    route: Route,
  },
  {
    path: routes.attendance,
    element: <AttendanceList />,
    route: Route,
  },
  {
    path: routes.leaves,
    element: <LeavesList />,
    route: Route,
  },
  {
    path: routes.leaves,
    element: <LeavesList />,
    route: Route,
  },
  {
    path: routes.leaveType,
    element: <LeaveType />,
    route: Route,
  },
  {
    path: routes.holidays,
    element: <HolidaysList />,
    route: Route,
  },
  {
    path: routes.payroll,
    element: <PayrollList />,
    route: Route,
  },
  {
    path: routes.payroll2,
    element: <PayrollTwo />,
    route: Route,
  },
  {
    path: routes.expenses,
    element: <ExpensesList />,
    route: Route,
  },
  {
    path: routes.expenseCategory,
    element: <ExpenseCategory />,
    route: Route,
  },
  {
    path: routes.income,
    element: <IncomeList />,
    route: Route,
  },
  {
    path: routes.invoices,
    element: <InvoicesList />,
    route: Route,
  },
  {
    path: routes.invoicesDetails,
    element: <InvoicesDetails />,
    route: Route,
  },
  {
    path: routes.addInvoices,
    element: <AddInvoices />,
    route: Route,
  },
  {
    path: routes.editInvoices,
    element: <EditInvoices />,
    route: Route,
  },
  {
    path: routes.payments,
    element: <PaymentsList />,
    route: Route,
  },
  {
    path: routes.transactions,
    element: <TransactionsList />,
    route: Route,
  },
  {
    path: routes.pages,
    element: <Pages />,
    route: Route,
  },
  {
    path: routes.addPage,
    element: <AddPages />,
    route: Route,
  },
  {
    path: routes.editPage,
    element: <EditPage />,
    route: Route,
  },
  {
    path: routes.addBlogs,
    element: <AddBlog />,
    route: Route,
  },
  {
    path: routes.blogs,
    element: <Blogs />,
    route: Route,
  },
  {
    path: routes.editBlogs,
    element: <EditBlog />,
    route: Route,
  },
  {
    path: routes.blogCategories,
    element: <BlogCategories />,
    route: Route,
  },
  {
    path: routes.blogComments,
    element: <BlogComments />,
    route: Route,
  },
  {
    path: routes.countries,
    element: <Countries />,
    route: Route,
  },
  {
    path: routes.states,
    element: <States />,
    route: Route,
  },
  {
    path: routes.cities,
    element: <Cities />,
    route: Route,
  },
  {
    path: routes.testimonials,
    element: <Testimonials />,
    route: Route,
  },
  {
    path: routes.faq,
    element: <Faq />,
    route: Route,
  },
  {
    path: routes.pricing,
    element: <Pricing />,
    route: Route,
  },
  {
    path: routes.appointments,
    element: <Appointments />,
    route: Route,
  },
  {
    path: routes.newAppointment,
    element: <NewAppointment />,
    route: Route,
  },
  {
    path: routes.editAppointment,
    element: <EditAppointment />,
    route: Route,
  },
  {
    path: routes.appointmentCalendar,
    element: <AppointmentCalendar />,
    route: Route,
  },
  {
    path: routes.locations,
    element: <Locations />,
    route: Route,
  },
  {
    path: routes.services,
    element: <Services />,
    route: Route,
  },
  {
    path: routes.specializations,
    element: <Specializations />,
    route: Route,
  },

  {
    path: routes.assets,
    element: <Assets />,
    route: Route,
  },
  {
    path: routes.activities,
    element: <Activities />,
    route: Route,
  },
  {
    path: routes.messages,
    element: <Messages />,
    route: Route,
  },
  {
    path: routes.addInvoice,
    element: <AddInoivce />,
    route: Route,
  },
  {
    path: routes.notifications,
    element: <Notifications />,
    route: Route,
  },
  {
    path: routes.appointmentconsultations,
    element: <AppointmentConsultations />,
    route: Route,
  },
  {
    path: routes.consultations,
    element: <ConsultationsList />,
    route: Route,
  },
  {
    path: routes.privacyPolicy,
    element: <PrivacyPolicy />,
    route: Route,
  },
  {
    path: routes.signaturessettings,
    element: <SignaturesSettings />,
    route: Route,
  },
  {
    path: routes.customfieldssettings,
    element: <CustomFieldsSettings />,
    route: Route,
  },
  {
    path: routes.banipaddresssettings,
    element: <BanIpAddressSettings />,
    route: Route,
  },
];
export const authRoutes = [
  {
    path: routes.home,
    element: <HomePage />,
    route: Route,
  },
  {
    path: routes.aboutUs,
    element: <AboutUs />,
    route: Route,
  },
  {
    path: routes.servicesFront,
    element: <ServicesFront />,
    route: Route,
  },
  {
    path: routes.contactUs,
    element: <ContactUs />,
    route: Route,
  },
  {
    path: routes.privacyPolicyFront,
    element: <PrivacyPolicyFront />,
    route: Route,
  },
  {
    path: routes.termsConditionFront,
    element: <TermsConditionFront />,
    route: Route,
  },
  {
    path: routes.refundPolicyFront,
    element: <RefundPolicyFront />,
    route: Route,
  },
  {
    path: routes.login,
    element: <Login />,
    route: Route,
  },
  {
    path: routes.loginCover,
    element: <LoginCover />,
    route: Route,
  },
  {
    path: routes.loginillustration,
    element: <LoginIllustration />,
    route: Route,
  },
  {
    path: routes.loginbasic,
    element: <LoginBasic />,
    route: Route,
  },
  {
    path: routes.registercover,
    element: <RegisterCover />,
    route: Route,
  },
  {
    path: routes.registerillustration,
    element: <RegisterIllustration />,
    route: Route,
  },
  {
    path: routes.registerbasic,
    element: <MultiStepRegister />,
    route: Route,
  },
  {
    path: routes.forgotpasswordcover,
    element: <ForgotPasswordCover />,
    route: Route,
  },

  {
    path: routes.forgotpasswordillustration,
    element: <ForgotPasswordIllustration />,
    route: Route,
  },
  {
    path: routes.forgotpasswordbasic,
    element: <ForgotPasswordBasic />,
    route: Route,
  },
  {
    path: routes.resetpasswordcover,
    element: <ResetPasswordCover />,
    route: Route,
  },
  {
    path: routes.resetpasswordillustration,
    element: <ResetPasswordIllustration />,
    route: Route,
  },
  {
    path: routes.resetpasswordbasic,
    element: <ResetPasswordBasic />,
    route: Route,
  },
  {
    path: routes.emailverificationcover,
    element: <EmailVerificationCover />,
    route: Route,
  },
  {
    path: routes.emailverificationillustration,
    element: <EmailVerificationIllustration />,
    route: Route,
  },
  {
    path: routes.emailverificationbasic,
    element: <EmailVerificationBasic />,
    route: Route,
  },
  {
    path: routes.twostepverificationcover,
    element: <TwoStepVerificationCover />,
    route: Route,
  },
  {
    path: routes.twostepverificationillustration,
    element: <TwoStepVerificationIllustration />,
    route: Route,
  },
  {
    path: routes.twostepverificationbasic,
    element: <TwoStepVerificationBasic />,
    route: Route,
  },
  {
    path: routes.lockscreen,
    element: <LockScreen />,
    route: Route,
  },
  {
    path: routes.error404,
    element: <Error404 />,
    route: Route,
  },
  {
    path: routes.error500,
    element: <Error500 />,
    route: Route,
  },
  {
    path: routes.comingSoon,
    element: <ComingSoon />,
    route: Route,
  },
  {
    path: routes.underMaintenance,
    element: <UnderMaintenance />,
    route: Route,
  },
];
