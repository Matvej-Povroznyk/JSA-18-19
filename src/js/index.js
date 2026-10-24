import * as basicLightBox from "basiclightbox";
import "basiclightbox/dist/basicLightbox.min.css";

const API_URL = "http://localhost:3000/students";

const getStudentsBtn = document.querySelector("#get-students-btn");
const addStudentsForm = document.querySelector("#add-student-form");
const studentsTableBody = document.querySelector("#students-table tbody");

function openEditModal(student) {
  const editModal = basicLightBox.create(
    `
    <div class="modal">
        <button type="button" class="close-modal-btn">&times;</button>
        <h2>Редагувати студента</h2>
        <form id="edit-student-form">
            <label>Ім'я: <input type="text" name="name" required /></label>
            <label>Вік: <input type="number" name="age" required /></label>
            <label>Курс: <input type="text" name="course" required /></label>
            <label>Навички (через кому): <input type="text" name="skills"/></label>
            <label>Email: <input type="email" name="email" required /></label>
            <label>Записаний: <input type="checkbox" name="isEnrolled" /></label>
            <button type="submit">Зберегти</button>
        </form>
    </div>
    `,
    {
      closable: false,
      onShow: (instance) => {
        const form = instance.element().querySelector("#edit-student-form");
        const closeBtn = instance.element().querySelector(".close-modal-btn");

        closeBtn.onclick = () => instance.close();

        form.name.value = student.name;
        form.age.value = student.age;
        form.course.value = student.course;
        form.skills.value = (student.skills || []).join(", ");
        form.email.value = student.email;
        form.isEnrolled.checked = student.isEnrolled;

        form.onsubmit = (e) => {
          e.preventDefault();

          const updatedData = {
            name: form.name.value.trim(),
            age: Number(form.age.value),
            course: form.course.value.trim(),
            skills: parseSkills(form.skills.value),
            email: form.email.value.trim(),
            isEnrolled: form.isEnrolled.checked,
          };

          updateStudent(student.id, updatedData)
            .then(() => {
              instance.close();
              return getStudents().then(renderStudents);
            })
            .catch((err) => console.error(err));
        };
      },
    },
  );

  editModal.show();
}

function getStudents() {
  return fetch(API_URL)
    .then((res) => {
      if (!res.ok) throw new Error(`Помилка ${res.status}: ${res.statusText}`);
      return res.json();
    })
    .catch((err) => {
      console.error(err);
      return [];
    });
}

function renderStudents(students) {
  if (!students) return;

  const markup = students
    .map((student) => {
      const skillsMarkup =
        student.skills && student.skills.length > 0
          ? student.skills.join(", ")
          : "Відсутні";

      return `
        <tr>
            <td>${student.id}</td>
            <td>${student.name}</td>
            <td>${student.age}</td>
            <td>${student.course}</td>
            <td>${skillsMarkup}</td>
            <td>${student.email}</td>
            <td>${student.isEnrolled ? "Так" : "Ні"}</td>
            <td>
                <button class="delete-btn" style="margin-bottom: 5px;" data-id="${student.id}" data-action="delete">
                    <svg width="16px" height="16px" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path fill-rule="evenodd" clip-rule="evenodd" d="M16 8C16 12.4183 12.4183 16 8 16C3.58172 16 0 12.4183 0 8C0 3.58172 3.58172 0 8 0C12.4183 0 16 3.58172 16 8ZM10.3128 12.4341C9.62116 12.7956 8.83445 13 8 13C5.23858 13 3 10.7614 3 8C3 7.16555 3.20441 6.37884 3.5659 5.68722L10.3128 12.4341ZM12.4341 10.3128L5.68722 3.5659C6.37884 3.20441 7.16555 3 8 3C10.7614 3 13 5.23858 13 8C13 8.83445 12.7956 9.62116 12.4341 10.3128Z" fill="currentColor"/>
                    </svg>
                </button>
                <button class="update-btn" data-id="${student.id}" data-action="edit">
                    <svg width="16px" height="16px" viewBox="0 0 16 16" fill="white" xmlns="http://www.w3.org/2000/svg">
                        <path d="M13 0L16 3L9 10H6V7L13 0Z" fill="currentColor"/>
                        <path d="M1 1V15H15V9H13V13H3V3H7V1H1Z" fill="currentColor"/>
                    </svg>
                </button>
            </td>
        </tr>
      `;
    })
    .join("");

  studentsTableBody.innerHTML = markup;
}

function addStudent(e) {
  e.preventDefault();

  const newStudent = {
    name: addStudentsForm.name.value.trim(),
    age: Number(addStudentsForm.age.value),
    course: addStudentsForm.course.value.trim(),
    skills: addStudentsForm.skills.value
      .trim()
      .split(/\s*,\s*/)
      .filter(Boolean),
    email: addStudentsForm.email.value.trim(),
    isEnrolled: addStudentsForm.isEnrolled.checked,
  };

  fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(newStudent),
  })
    .then((res) => {
      if (!res.ok) throw new Error(`Помилка: ${res.statusText}`);
      addStudentsForm.reset();
      return getStudents().then(renderStudents);
    })
    .catch((err) => console.error(err));
}

function updateStudent(id, data) {
  return fetch(`${API_URL}/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  }).then((res) => {
    if (!res.ok) throw new Error(`Error: ${res.statusText}`);
  });
}

function deleteStudent(id) {
  return fetch(`${API_URL}/${id}`, { method: "DELETE" }).then((res) => {
    if (!res.ok) throw new Error(`Помилка: ${res.statusText}`);
  });
}

function getStudentById(id) {
  return fetch(`${API_URL}/${id}`).then((res) => {
    if (!res.ok) throw new Error(`Помилка: ${res.statusText}`);
    return res.json();
  });
}

function handleTableClick(e) {
  const btn = e.target.closest("[data-action]");
  if (!btn) return;

  const { action, id } = btn.dataset;

  if (action === "delete") {
    deleteStudent(id)
      .then(() => btn.closest("tr").remove())
      .catch((err) => console.error(err));
  } else if (action === "edit") {
    getStudentById(id)
      .then(openEditModal)
      .catch((err) => console.error(err));
  }
}

getStudentsBtn.addEventListener("click", () =>
  getStudents().then(renderStudents),
);
addStudentsForm.addEventListener("submit", addStudent);
studentsTableBody.addEventListener("click", handleTableClick);
