/**
 * Listados oficiales de estudiantes por salón.
 * Formato de nombre: "Nombre(s) Apellido(s)". El orden de cada lista define los códigos (EST-<salón><nnn>).
 * Horario por defecto de cada salón: lunes a viernes 12:30–18:00, margen de 10 min.
 */
export const GRUPOS = [
  {
    name: '6',
    grade: '6°',
    students: [
      'Kyara Acosta', 'Matia Álvarez', 'Juan Alvis', 'Samuel Arias', 'Darwin Arrieta',
      'Jesús Barreto', 'Rafael Barrios', 'Ana Caballero', 'Edgar Cardenas', 'Abraham Carey',
      'Ruth Castaño', 'Felipe Castro', 'Monserrat Castro', 'Linda Contreras', 'Luis Coronell',
      'José Daza', 'Simón De Alba', 'Brayan De Ávila', 'Valeria España', 'Mari Paz Garay',
      'Thiago García', 'Dilan Gómez', 'Sharon Guerra', 'Sneyder Guiral', 'Dilan Martínez',
      'Maicol Montaño', 'Dilan Moreno', 'Emily Orjuela', 'Geraldin Páez', 'Ana Pedraza',
      'Julieta Pérez', 'Gianna Perez', 'Isabela Quesada', 'Samuel Quijano', 'Esleider Ramírez',
      'Andrés Rangel', 'María Paz Rocha', 'Camila Vergara', 'José Victoria', 'Shadia Yance',
    ],
  },
  {
    name: '9',
    grade: '9°',
    students: [
      'Jesus Arias', 'Alan Ballestas', 'Emanuel Campo', 'Paula Caceres', 'Pedro Daza',
      'Ana De la Hoz', 'Miguel Gomez', 'Oriana Garavito', 'Ivana Gomez', 'Gordillo',
      'Karol Gutierrez', 'Lili Herrera', 'Michelle Hoffman', 'Ana Leyva', 'Juan Macias',
      'Kevin Martinez', 'Zeavi Narvaez', 'Mario Olivero', 'Herlin Ortiz', 'Bryan Palmar',
      'Linda Pallares', 'Abraham Rivas', 'Juan Rodriguez', 'Lismary Romero', 'Sofia Romo',
      'Luis Salcedo', 'Shaidy Sierra', 'Mariana Sosa', 'Sheyla Tovar', 'Jhoendis Vergara',
      'Dalkin Viloria', 'Juan Yerena',
    ],
  },
  {
    name: '11',
    grade: '11°',
    students: [
      'Andrés Felipe Arias Gámez', 'María Carolina Brochero Gullo', 'Laura Daniela Buelva Torregrosa',
      'Juan Manuel Buelvas Ruiz', 'Cynthia Elena Calderon Sierra', 'Mateo Enrique Carranza Vanegas',
      'María Fernanda Castrillon Jiménez', 'Ángel David Coronell Garavito', 'Sebastián David Diazgranados Ariña',
      'Paula Andrea García Tarazona', 'Sofía Daniela Gómez Anaya', 'Harold Alexis Gómez Bravo',
      'Valentina Gómez Mendoza', 'Nelson Camilo Guerrero Mora', 'María Alejandra Herrera Solera',
      'Michelle Madero Pineda', 'Juan David Martínez Suárez', 'José Alejandro Miranda Palacio',
      'Mariana Isabel Monterroza Castro', 'Johan Stiven Muñoz Mosquera', 'Christian Kmilo Navarro Ramos',
      'Juliana Marcela Osorio Santos', 'Nathalie Sofía Ovalle Moreno', 'Yorelis Elena Padilla Jaramillo',
      'Enerieth Paola Padilla Méndez', 'Geraldine María Pérez Tovar', 'Mariangel Polo Cudriz',
      'Thaliana Andrea Polo Hernández', 'Nicoll Andrea Prada Pedraza', 'Marianis Sofía Prada Vita',
      'Carmen Sofía Rivera Arroyo', 'Marco Antonio Roa Olivella', 'Valery Sofía Romo Pabuena',
      'Sharon Alexandra Zapata Guaje',
    ],
  },
];

export const HORARIO = { days: [1, 2, 3, 4, 5], start: '12:30', end: '18:00', margin: 10, subject: 'Jornada tarde' };

/** Código del estudiante: EST-06001, EST-09001, EST-11001 ... */
export const studentCode = (roomName, n) => `EST-${String(roomName).padStart(2, '0')}${String(n).padStart(3, '0')}`;
