import React from 'react';
import { useNavigate } from 'react-router-dom';

interface Props {
  student: any;
  onLogout: () => void;
}

const StudentProfileMenu: React.FC<Props> = ({ student, onLogout }) => {
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(false);
  const backendUrl = process.env.REACT_APP_BACKEND_URL;

  // Fallback-safe profile photo with cache-busting
  const [photoUrl, setPhotoUrl] = React.useState(() => {
    return student?.profilePicture
      ? `${backendUrl}/public${student.profilePicture}?t=${Date.now()}`
      : `https://api-lstravel.edubridgeerp.in/public/uploads/profile/default-avatar.png`;
  });

  // Refresh photo if student object updates
  React.useEffect(() => {
    if (student?.profilePicture) {
      setPhotoUrl(`${backendUrl}/public${student.profilePicture}?t=${Date.now()}`);
    }
  }, [student?.profilePicture, backendUrl]);

  return (
    <div className="absolute top-4 right-4 z-50">
      <div className="relative">
        <img
          src={photoUrl}
          onClick={() => setOpen(!open)}
          onError={(e) => {
            e.currentTarget.src = `${backendUrl}/public/default-avatar.png`;
          }}
          className="w-10 h-10 rounded-full border-2 border-blue-500 cursor-pointer"
          alt="Student"
        />
        {open && (
          <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded shadow-md text-sm">
            <div className="p-3 border-b text-center">
              <img
                src={photoUrl}
                onError={(e) => {
                  e.currentTarget.src = `${backendUrl}/public/default-avatar.png`;
                }}
                className="w-12 h-12 rounded-full mx-auto mb-1"
                alt="Avatar"
              />
              <div className="font-bold">{student.name}</div>
              <div className="text-gray-500 text-xs">{student.admissionNumber}</div>
            </div>
            <button
              onClick={() => {
                setOpen(false);
                navigate('/student/profile');
              }}
              className="w-full px-4 py-2 hover:bg-gray-100 text-left"
            >
              View Profile
            </button>
            <button
              onClick={() => {
                setOpen(false);
                onLogout();
              }}
              className="w-full px-4 py-2 hover:bg-red-100 text-left text-red-600"
            >
              Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default StudentProfileMenu;
