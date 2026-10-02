export const isTeacher = user => user?.active === true && ['teacher','admin'].includes(user.role);
export const canAccessCourse = (user, courseId) => user?.active === true && (isTeacher(user) || (user.role === 'student' && Array.isArray(user.courses) && user.courses.includes(courseId)));
export const canAccessResource = (user, resource) => user?.active === true && (isTeacher(user) || (resource?.active === true && resource.visibility === 'student' && canAccessCourse(user, resource.courseId)));
export function safeCoursePath(courseId) {
  if (!/^[a-z0-9-]+$/.test(courseId)) throw new Error('Invalid course');
  return 'courses/' + courseId + '/index.html';
}

