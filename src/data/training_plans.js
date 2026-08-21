export const trainingPlansData = [
  {
    "plan_id": "fuerza_hipertrofia_4d",
    "plan_name": "Rutina de Fuerza & Hipertrofia (4 Días - Rest-Pause / Biseries)",
    "technique_title": "Rutina de Fuerza & Hipertrofia (4 Días)",
    "technique_name": "Biseries Antagonistas & Rest-Pause",
    "technique_description": "Ejecuta los ejercicios A1 y A2 de forma consecutiva con mínimo descanso. En la última serie del ejercicio principal, realiza un descanso breve de 15 segundos y completa reps adicionales al fallo técnico (Rest-Pause).",
    "cardio_schedule": "25 minutos de caminata a paso ligero en caminadora con 5% de inclinación (115-130 PPM / Zona 2) al finalizar la sesión de pesas.",
    "abdomen_table": [
      {
        "name": "Crunch en Polea Alta con Cuerda",
        "video_url": "https://www.youtube.com/watch?v=2fROkQxBStg",
        "weeks": [
          {
            "week": 1,
            "sets": 3,
            "reps": "15",
            "tempo": "2,1,2"
          },
          {
            "week": 2,
            "sets": 3,
            "reps": "15",
            "tempo": "2,1,2"
          },
          {
            "week": 3,
            "sets": 4,
            "reps": "15",
            "tempo": "2,1,2"
          },
          {
            "week": 4,
            "sets": 4,
            "reps": "15",
            "tempo": "2,1,2"
          }
        ]
      },
      {
        "name": "Elevación de Piernas Colgado en Barra",
        "video_url": "https://www.youtube.com/watch?v=hdng3Nm1x_E",
        "weeks": [
          {
            "week": 1,
            "sets": 3,
            "reps": "12-15",
            "tempo": "2,0,2"
          },
          {
            "week": 2,
            "sets": 3,
            "reps": "12-15",
            "tempo": "2,0,2"
          },
          {
            "week": 3,
            "sets": 4,
            "reps": "12-15",
            "tempo": "2,0,2"
          },
          {
            "week": 4,
            "sets": 4,
            "reps": "12-15",
            "tempo": "2,0,2"
          }
        ]
      },
      {
        "name": "(A) Plancha Isométrica Core con Carga",
        "video_url": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
        "weeks": [
          {
            "week": 1,
            "sets": 3,
            "reps": "45 seg",
            "tempo": "Fijo"
          },
          {
            "week": 2,
            "sets": 3,
            "reps": "45 seg",
            "tempo": "Fijo"
          },
          {
            "week": 3,
            "sets": 4,
            "reps": "60 seg",
            "tempo": "Fijo"
          },
          {
            "week": 4,
            "sets": 4,
            "reps": "60 seg",
            "tempo": "Fijo"
          }
        ]
      }
    ],
    "days": [
      {
        "day_number": 1,
        "day_name": "Día 1: Pecho & Espalda (Empuje - Jalón)",
        "day_title": "Día 1: Pecho & Espalda (Empuje - Jalón)",
        "focus": "Pecho & Espalda (Torso Completo)",
        "biseries": [
          {
            "biserie_id": "B1",
            "biserie_label": "Biserie A (Fuerza Torso)",
            "exercises": [
              {
                "name": "Press de Banca Plano con Barra",
                "sets": 4,
                "reps": "8 - 10",
                "tempo": "2,1,2",
                "rest": "90s",
                "rpe": "RPE 8.5",
                "target_muscle": "Pecho",
                "svg_type": "chest",
                "video_url": "https://www.youtube.com/watch?v=rT7DgCr-3pg",
                "notes": "Mantener retracción escapular y apoyar pies firmes en el piso.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  }
                ]
              },
              {
                "name": "Remo con Barra Agarre Prono",
                "sets": 4,
                "reps": "8 - 10",
                "tempo": "2,1,2",
                "rest": "90s",
                "rpe": "RPE 8.5",
                "target_muscle": "Espalda",
                "svg_type": "back",
                "video_url": "https://www.youtube.com/watch?v=FWJR5Ve8bnQ",
                "notes": "Tirar con los codos hacia la cadera manteniendo la columna neutra.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  }
                ]
              }
            ]
          },
          {
            "biserie_id": "B2",
            "biserie_label": "Biserie B (Hipertrofia & Rest-Pause)",
            "exercises": [
              {
                "name": "Press Inclinado con Mancuernas",
                "sets": 3,
                "reps": "10 - 12",
                "tempo": "3,1,1",
                "rest": "60s",
                "rpe": "RPE 9",
                "target_muscle": "Pecho Superior",
                "svg_type": "chest",
                "video_url": "https://www.youtube.com/watch?v=8iPEnn-ltC8",
                "notes": "Inclinación de banco a 30°. En la serie 3 realizar Rest-Pause (+3-4 reps).",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 2,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 3,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 4,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "3,1,1"
                  }
                ]
              },
              {
                "name": "Jalón al Pecho Agarre Neutro en Polea",
                "sets": 3,
                "reps": "10 - 12",
                "tempo": "2,1,2",
                "rest": "60s",
                "rpe": "RPE 8.5",
                "target_muscle": "Dorsal Ancho",
                "svg_type": "back",
                "video_url": "https://www.youtube.com/watch?v=CAwf7n6Luuc",
                "notes": "Llevar el agarre al esternón apretando escápulas al final.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "day_number": 2,
        "day_name": "Día 2: Pierna Completa & Femorales",
        "day_title": "Día 2: Pierna Completa & Femorales",
        "focus": "Cuádriceps, Isquios & Glúteos",
        "biseries": [
          {
            "biserie_id": "B1",
            "biserie_label": "Biserie A (Dominante de Cadera / Rodilla)",
            "exercises": [
              {
                "name": "Sentadilla Trasera con Barra (Back Squat)",
                "sets": 4,
                "reps": "6 - 8",
                "tempo": "3,1,1",
                "rest": "120s",
                "rpe": "RPE 8.5",
                "target_muscle": "Cuádriceps & Glúteos",
                "svg_type": "legs",
                "video_url": "https://www.youtube.com/watch?v=ultWZbUMPL8",
                "notes": "Bajar romper el paralelo a 90° manteniendo rodillas alineadas con la punta del pie.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "6-8",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "6-8",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "6-8",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "6-8",
                    "tempo": "3,1,1"
                  }
                ]
              },
              {
                "name": "Peso Muerto Rumano con Mancuernas",
                "sets": 4,
                "reps": "8 - 10",
                "tempo": "3,1,1",
                "rest": "90s",
                "rpe": "RPE 8",
                "target_muscle": "Femorales / Isquios",
                "svg_type": "legs",
                "video_url": "https://www.youtube.com/watch?v=JCXUYuzwvgM",
                "notes": "Empujar la cadera hacia atrás sintiendo el estiramiento en la parte posterior.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "3,1,1"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "3,1,1"
                  }
                ]
              }
            ]
          },
          {
            "biserie_id": "B2",
            "biserie_label": "Biserie B (Aislamiento de Pierna)",
            "exercises": [
              {
                "name": "Prensa de Pierna 45°",
                "sets": 3,
                "reps": "10 - 12",
                "tempo": "2,1,2",
                "rest": "75s",
                "rpe": "RPE 9",
                "target_muscle": "Cuádriceps",
                "svg_type": "legs",
                "video_url": "https://www.youtube.com/watch?v=IZxyjWcy36U",
                "notes": "Pies a la anchura de hombros en el centro de la plataforma.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 3,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  }
                ]
              },
              {
                "name": "Curl Femoral Tumbado en Máquina",
                "sets": 3,
                "reps": "12 - 15",
                "tempo": "2,1,2",
                "rest": "60s",
                "rpe": "RPE 9",
                "target_muscle": "Femorales",
                "svg_type": "legs",
                "video_url": "https://www.youtube.com/watch?v=1Tq3QdYUuHs",
                "notes": "Controlar la bajada excéntrica en 2 segundos.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 3,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 3,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 3,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 3,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "day_number": 3,
        "day_name": "Día 3: Hombro & Abdomen Core",
        "day_title": "Día 3: Hombro & Abdomen Core",
        "focus": "Deltoides & Estabilidad Abdominal",
        "biseries": [
          {
            "biserie_id": "B1",
            "biserie_label": "Biserie A (Deltoides Lateral & Anterior)",
            "exercises": [
              {
                "name": "Press Militar con Mancuernas",
                "sets": 4,
                "reps": "8 - 10",
                "tempo": "2,1,2",
                "rest": "90s",
                "rpe": "RPE 8.5",
                "target_muscle": "Hombro Anterior",
                "svg_type": "shoulders",
                "video_url": "https://www.youtube.com/watch?v=B-aVuyhvLHU",
                "notes": "Mantener torso erguido sin hiperextender la zona lumbar.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "8-10",
                    "tempo": "2,1,2"
                  }
                ]
              },
              {
                "name": "Elevaciones Laterales con Polea",
                "sets": 4,
                "reps": "12 - 15",
                "tempo": "2,1,2",
                "rest": "60s",
                "rpe": "RPE 9",
                "target_muscle": "Deltoides Lateral",
                "svg_type": "shoulders",
                "video_url": "https://www.youtube.com/watch?v=PzsMitRZs_0",
                "notes": "Elevar a la altura del hombro sosteniendo 1 segundo arriba.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "12-15",
                    "tempo": "2,1,2"
                  }
                ]
              }
            ]
          },
          {
            "biserie_id": "B2",
            "biserie_label": "Biserie B (Deltoides Posterior & Core)",
            "exercises": [
              {
                "name": "Pájaro / Pájaros en Polea Posterior",
                "sets": 3,
                "reps": "15",
                "tempo": "2,1,2",
                "rest": "60s",
                "rpe": "RPE 8.5",
                "target_muscle": "Deltoides Posterior",
                "svg_type": "shoulders",
                "video_url": "https://www.youtube.com/watch?v=t5J5s-j8a2M",
                "notes": "Enfocar la tracción en la parte trasera del hombro.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 3,
                    "reps": "15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 3,
                    "reps": "15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 3,
                    "reps": "15",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 3,
                    "reps": "15",
                    "tempo": "2,1,2"
                  }
                ]
              },
              {
                "name": "(A) Plancha Core / Abdominal",
                "sets": 4,
                "reps": "45 segundos",
                "tempo": "Isométrico",
                "rest": "45s",
                "rpe": "RPE 8",
                "target_muscle": "Abdomen / Core",
                "svg_type": "core",
                "video_url": "https://www.youtube.com/watch?v=pSHjTRCQxIw",
                "notes": "Apretar glúteos y abdomen manteniendo alineación neutra de columna.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "45 seg",
                    "tempo": "Isométrico"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "45 seg",
                    "tempo": "Isométrico"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "45 seg",
                    "tempo": "Isométrico"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "45 seg",
                    "tempo": "Isométrico"
                  }
                ]
              }
            ]
          }
        ]
      },
      {
        "day_number": 4,
        "day_name": "Día 4: Brazo Completo (Bíceps & Tríceps)",
        "day_title": "Día 4: Brazo Completo (Bíceps & Tríceps)",
        "focus": "Bíceps, Tríceps & Antebrazo",
        "biseries": [
          {
            "biserie_id": "B1",
            "biserie_label": "Biserie A (Bíceps & Tríceps Masa)",
            "exercises": [
              {
                "name": "Curl de Bíceps con Barra Z",
                "sets": 4,
                "reps": "10 - 12",
                "tempo": "2,1,2",
                "rest": "60s",
                "rpe": "RPE 8.5",
                "target_muscle": "Bíceps",
                "svg_type": "biceps",
                "video_url": "https://www.youtube.com/watch?v=soxrZlIl35U",
                "notes": "Evitar balancear la cadera durante el movimiento.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  }
                ]
              },
              {
                "name": "Press Francés con Barra Z en Banco Plano",
                "sets": 4,
                "reps": "10 - 12",
                "tempo": "2,1,2",
                "rest": "60s",
                "rpe": "RPE 8.5",
                "target_muscle": "Tríceps",
                "svg_type": "triceps",
                "video_url": "https://www.youtube.com/watch?v=d_KZxkY_0cM",
                "notes": "Flexionar codos llevando la barra hacia la frente.",
                "weeks": [
                  {
                    "week": 1,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 2,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 3,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  },
                  {
                    "week": 4,
                    "sets": 4,
                    "reps": "10-12",
                    "tempo": "2,1,2"
                  }
                ]
              }
            ]
          }
        ]
      }
    ]
  }
];
