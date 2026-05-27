import { Link, useParams } from "react-router";
import DoctorFormPage from "../doctor-form/doctorFormPage";
import { all_routes } from "../../../../routes/all_routes";

const EditDoctor = () => {
  const { id } = useParams<{ id: string }>();

  if (!id || id === ":id") {
    return (
      <div className="page-wrapper">
        <div className="content">
          <Link to={all_routes.doctors} className="btn btn-light mb-3">
            Back to Doctors
          </Link>
          <div className="alert alert-warning mb-0">
            Invalid edit link. Use Edit from a doctor card in the Doctors list.
          </div>
        </div>
      </div>
    );
  }

  return <DoctorFormPage mode="edit" doctorId={id} />;
};

export default EditDoctor;
