--
-- PostgreSQL database dump
--

\restrict b0oFAfGpWirioLbRX5PQOQWIaicJf99hhxldiRzG6TEx9lU4yhh6r30fSNZ4hNA

-- Dumped from database version 16.15 (Ubuntu 16.15-0ubuntu0.24.04.1)
-- Dumped by pg_dump version 17.12 (Ubuntu 17.12-1.pgdg24.04+1)

-- Started on 2026-11-28 02:29:50 CST

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 215 (class 1259 OID 26010)
-- Name: alumnos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alumnos (
    id integer NOT NULL,
    usuario_id integer,
    matricula character varying(20) NOT NULL,
    carrera character varying(150) NOT NULL,
    semestre integer
);


ALTER TABLE public.alumnos OWNER TO postgres;

--
-- TOC entry 216 (class 1259 OID 26013)
-- Name: alumnos_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.alumnos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.alumnos_id_seq OWNER TO postgres;

--
-- TOC entry 3693 (class 0 OID 0)
-- Dependencies: 216
-- Name: alumnos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.alumnos_id_seq OWNED BY public.alumnos.id;


--
-- TOC entry 232 (class 1259 OID 26430)
-- Name: docentes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.docentes (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    numero_empleado character varying(30),
    departamento character varying(150)
);


ALTER TABLE public.docentes OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 26429)
-- Name: docentes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.docentes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.docentes_id_seq OWNER TO postgres;

--
-- TOC entry 3694 (class 0 OID 0)
-- Dependencies: 231
-- Name: docentes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.docentes_id_seq OWNED BY public.docentes.id;


--
-- TOC entry 236 (class 1259 OID 26468)
-- Name: docentes_vacante; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.docentes_vacante (
    id integer NOT NULL,
    vacante_id integer NOT NULL,
    docente_id integer NOT NULL,
    funcion character varying(20) NOT NULL,
    fecha_asignacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT docentes_vacante_funcion_check CHECK (((funcion)::text = ANY ((ARRAY['asesor'::character varying, 'revisor'::character varying])::text[])))
);


ALTER TABLE public.docentes_vacante OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 26467)
-- Name: docentes_vacante_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.docentes_vacante_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.docentes_vacante_id_seq OWNER TO postgres;

--
-- TOC entry 3695 (class 0 OID 0)
-- Dependencies: 235
-- Name: docentes_vacante_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.docentes_vacante_id_seq OWNED BY public.docentes_vacante.id;


--
-- TOC entry 217 (class 1259 OID 26014)
-- Name: empresas; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.empresas (
    id integer NOT NULL,
    usuario_id integer,
    nombre character varying(150) NOT NULL,
    descripcion text,
    direccion text,
    telefono character varying(20),
    estado_republica character varying(40),
    CONSTRAINT empresas_estado_republica_check CHECK (((estado_republica IS NULL) OR ((estado_republica)::text = ANY ((ARRAY['Aguascalientes'::character varying, 'Baja California'::character varying, 'Baja California Sur'::character varying, 'Campeche'::character varying, 'Chiapas'::character varying, 'Chihuahua'::character varying, 'Ciudad de México'::character varying, 'Coahuila'::character varying, 'Colima'::character varying, 'Durango'::character varying, 'Estado de México'::character varying, 'Guanajuato'::character varying, 'Guerrero'::character varying, 'Hidalgo'::character varying, 'Jalisco'::character varying, 'Michoacán'::character varying, 'Morelos'::character varying, 'Nayarit'::character varying, 'Nuevo León'::character varying, 'Oaxaca'::character varying, 'Puebla'::character varying, 'Querétaro'::character varying, 'Quintana Roo'::character varying, 'San Luis Potosí'::character varying, 'Sinaloa'::character varying, 'Sonora'::character varying, 'Tabasco'::character varying, 'Tamaulipas'::character varying, 'Tlaxcala'::character varying, 'Veracruz'::character varying, 'Yucatán'::character varying, 'Zacatecas'::character varying])::text[]))))
);


ALTER TABLE public.empresas OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 26019)
-- Name: empresas_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.empresas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.empresas_id_seq OWNER TO postgres;

--
-- TOC entry 3696 (class 0 OID 0)
-- Dependencies: 218
-- Name: empresas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.empresas_id_seq OWNED BY public.empresas.id;


--
-- TOC entry 219 (class 1259 OID 26020)
-- Name: evaluaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.evaluaciones (
    id integer NOT NULL,
    residencia_id integer NOT NULL,
    calificacion numeric(5,2),
    observaciones text,
    fecha_evaluacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT evaluaciones_calificacion_check CHECK (((calificacion >= (0)::numeric) AND (calificacion <= (100)::numeric)))
);


ALTER TABLE public.evaluaciones OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 26027)
-- Name: evaluaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.evaluaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.evaluaciones_id_seq OWNER TO postgres;

--
-- TOC entry 3697 (class 0 OID 0)
-- Dependencies: 220
-- Name: evaluaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.evaluaciones_id_seq OWNED BY public.evaluaciones.id;


--
-- TOC entry 241 (class 1259 OID 26562)
-- Name: migraciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.migraciones (
    nombre character varying(255) NOT NULL,
    fecha_aplicacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE public.migraciones OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 26498)
-- Name: observaciones_reporte; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.observaciones_reporte (
    id integer NOT NULL,
    reporte_id integer NOT NULL,
    docente_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    pagina integer,
    contenido text NOT NULL,
    fecha_creacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT observaciones_reporte_contenido_check CHECK ((length(TRIM(BOTH FROM contenido)) > 0)),
    CONSTRAINT observaciones_reporte_pagina_check CHECK (((pagina IS NULL) OR (pagina >= 1))),
    CONSTRAINT observaciones_reporte_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['error'::character varying, 'comentario'::character varying, 'propuesta'::character varying])::text[])))
);


ALTER TABLE public.observaciones_reporte OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 26497)
-- Name: observaciones_reporte_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.observaciones_reporte_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.observaciones_reporte_id_seq OWNER TO postgres;

--
-- TOC entry 3698 (class 0 OID 0)
-- Dependencies: 237
-- Name: observaciones_reporte_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.observaciones_reporte_id_seq OWNED BY public.observaciones_reporte.id;


--
-- TOC entry 221 (class 1259 OID 26028)
-- Name: postulaciones; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.postulaciones (
    id integer NOT NULL,
    alumno_id integer NOT NULL,
    vacante_id integer NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_postulacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT postulaciones_estado_check CHECK (((estado)::text = ANY (ARRAY[('pendiente'::character varying)::text, ('aceptado'::character varying)::text, ('rechazado'::character varying)::text])))
);


ALTER TABLE public.postulaciones OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 26034)
-- Name: postulaciones_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.postulaciones_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.postulaciones_id_seq OWNER TO postgres;

--
-- TOC entry 3699 (class 0 OID 0)
-- Dependencies: 222
-- Name: postulaciones_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.postulaciones_id_seq OWNED BY public.postulaciones.id;


--
-- TOC entry 223 (class 1259 OID 26035)
-- Name: reportes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.reportes (
    id integer NOT NULL,
    residencia_id integer NOT NULL,
    numero_reporte integer NOT NULL,
    archivo_pdf text NOT NULL,
    fecha_entrega timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    es_ultimo boolean DEFAULT false NOT NULL,
    revisado_por integer,
    fecha_revision timestamp without time zone,
    fecha_actualizacion timestamp without time zone,
    vacante_id integer NOT NULL,
    subido_por integer,
    CONSTRAINT reportes_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobado'::character varying, 'rechazado'::character varying])::text[])))
);


ALTER TABLE public.reportes OWNER TO postgres;

--
-- TOC entry 224 (class 1259 OID 26042)
-- Name: reportes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.reportes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.reportes_id_seq OWNER TO postgres;

--
-- TOC entry 3700 (class 0 OID 0)
-- Dependencies: 224
-- Name: reportes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.reportes_id_seq OWNED BY public.reportes.id;


--
-- TOC entry 225 (class 1259 OID 26043)
-- Name: residencias; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.residencias (
    id integer NOT NULL,
    postulacion_id integer NOT NULL,
    asesor character varying(150),
    fecha_inicio date,
    fecha_fin date,
    estado character varying(30) DEFAULT 'pendiente'::character varying,
    CONSTRAINT residencias_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobada'::character varying, 'en_proceso'::character varying, 'finalizada'::character varying, 'no_concluida'::character varying, 'liberada'::character varying, 'rechazada'::character varying])::text[])))
);


ALTER TABLE public.residencias OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 26048)
-- Name: residencias_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.residencias_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.residencias_id_seq OWNER TO postgres;

--
-- TOC entry 3701 (class 0 OID 0)
-- Dependencies: 226
-- Name: residencias_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.residencias_id_seq OWNED BY public.residencias.id;


--
-- TOC entry 240 (class 1259 OID 26522)
-- Name: solicitudes_cambio_estado; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.solicitudes_cambio_estado (
    id integer NOT NULL,
    residencia_id integer NOT NULL,
    docente_id integer NOT NULL,
    estado_actual character varying(20) NOT NULL,
    estado_solicitado character varying(20) NOT NULL,
    motivo text NOT NULL,
    estado character varying(20) DEFAULT 'pendiente'::character varying NOT NULL,
    respuesta text,
    resuelta_por integer,
    fecha_solicitud timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    fecha_resolucion timestamp without time zone,
    CONSTRAINT solicitudes_cambio_estado_check CHECK (((estado_solicitado)::text <> (estado_actual)::text)),
    CONSTRAINT solicitudes_cambio_estado_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'aprobada'::character varying, 'rechazada'::character varying])::text[]))),
    CONSTRAINT solicitudes_cambio_estado_estado_solicitado_check CHECK (((estado_solicitado)::text = ANY ((ARRAY['en_proceso'::character varying, 'finalizada'::character varying, 'no_concluida'::character varying])::text[]))),
    CONSTRAINT solicitudes_cambio_estado_motivo_check CHECK ((length(TRIM(BOTH FROM motivo)) >= 10))
);


ALTER TABLE public.solicitudes_cambio_estado OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 26521)
-- Name: solicitudes_cambio_estado_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.solicitudes_cambio_estado_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.solicitudes_cambio_estado_id_seq OWNER TO postgres;

--
-- TOC entry 3702 (class 0 OID 0)
-- Dependencies: 239
-- Name: solicitudes_cambio_estado_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.solicitudes_cambio_estado_id_seq OWNED BY public.solicitudes_cambio_estado.id;


--
-- TOC entry 234 (class 1259 OID 26447)
-- Name: tokens_cuenta; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tokens_cuenta (
    id integer NOT NULL,
    usuario_id integer NOT NULL,
    tipo character varying(20) NOT NULL,
    token_hash character(64) NOT NULL,
    expira_en timestamp without time zone NOT NULL,
    usado_en timestamp without time zone,
    creado_en timestamp without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    CONSTRAINT tokens_cuenta_tipo_check CHECK (((tipo)::text = ANY ((ARRAY['activacion'::character varying, 'restablecimiento'::character varying])::text[])))
);


ALTER TABLE public.tokens_cuenta OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 26446)
-- Name: tokens_cuenta_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.tokens_cuenta_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.tokens_cuenta_id_seq OWNER TO postgres;

--
-- TOC entry 3703 (class 0 OID 0)
-- Dependencies: 233
-- Name: tokens_cuenta_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.tokens_cuenta_id_seq OWNED BY public.tokens_cuenta.id;


--
-- TOC entry 227 (class 1259 OID 26049)
-- Name: usuarios; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(100) NOT NULL,
    correo character varying(150) NOT NULL,
    password character varying(255),
    rol character varying(20) NOT NULL,
    fecha_registro timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    estado_cuenta character varying(20) DEFAULT 'activa'::character varying NOT NULL,
    creado_por integer,
    fecha_actualizacion timestamp without time zone,
    fecha_desactivacion timestamp without time zone,
    CONSTRAINT usuarios_activa_con_password_check CHECK ((((estado_cuenta)::text <> 'activa'::text) OR (password IS NOT NULL))),
    CONSTRAINT usuarios_estado_cuenta_check CHECK (((estado_cuenta)::text = ANY ((ARRAY['pendiente'::character varying, 'activa'::character varying, 'inactiva'::character varying])::text[]))),
    CONSTRAINT usuarios_rol_check CHECK (((rol)::text = ANY ((ARRAY['alumno'::character varying, 'empresa'::character varying, 'coordinador'::character varying, 'docente'::character varying])::text[])))
);


ALTER TABLE public.usuarios OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 26056)
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.usuarios_id_seq OWNER TO postgres;

--
-- TOC entry 3704 (class 0 OID 0)
-- Dependencies: 228
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- TOC entry 229 (class 1259 OID 26057)
-- Name: vacantes; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.vacantes (
    id integer NOT NULL,
    empresa_id integer NOT NULL,
    titulo character varying(150) NOT NULL,
    descripcion text,
    carrera character varying(150),
    requisitos text,
    estado character varying(20) DEFAULT 'pendiente'::character varying,
    fecha_publicacion timestamp without time zone DEFAULT CURRENT_TIMESTAMP,
    cupo integer,
    motivo_rechazo text,
    fecha_revision timestamp without time zone,
    CONSTRAINT vacantes_aprobada_con_cupo_check CHECK ((((estado)::text <> ALL ((ARRAY['activa'::character varying, 'cerrada'::character varying])::text[])) OR (cupo IS NOT NULL))),
    CONSTRAINT vacantes_cupo_check CHECK (((cupo IS NULL) OR (cupo >= 1))),
    CONSTRAINT vacantes_estado_check CHECK (((estado)::text = ANY ((ARRAY['pendiente'::character varying, 'activa'::character varying, 'cerrada'::character varying, 'rechazada'::character varying])::text[])))
);


ALTER TABLE public.vacantes OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 26064)
-- Name: vacantes_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

CREATE SEQUENCE public.vacantes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE public.vacantes_id_seq OWNER TO postgres;

--
-- TOC entry 3705 (class 0 OID 0)
-- Dependencies: 230
-- Name: vacantes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: postgres
--

ALTER SEQUENCE public.vacantes_id_seq OWNED BY public.vacantes.id;


--
-- TOC entry 3389 (class 2604 OID 26065)
-- Name: alumnos id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos ALTER COLUMN id SET DEFAULT nextval('public.alumnos_id_seq'::regclass);


--
-- TOC entry 3408 (class 2604 OID 26433)
-- Name: docentes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes ALTER COLUMN id SET DEFAULT nextval('public.docentes_id_seq'::regclass);


--
-- TOC entry 3411 (class 2604 OID 26471)
-- Name: docentes_vacante id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes_vacante ALTER COLUMN id SET DEFAULT nextval('public.docentes_vacante_id_seq'::regclass);


--
-- TOC entry 3390 (class 2604 OID 26066)
-- Name: empresas id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas ALTER COLUMN id SET DEFAULT nextval('public.empresas_id_seq'::regclass);


--
-- TOC entry 3391 (class 2604 OID 26067)
-- Name: evaluaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones ALTER COLUMN id SET DEFAULT nextval('public.evaluaciones_id_seq'::regclass);


--
-- TOC entry 3413 (class 2604 OID 26501)
-- Name: observaciones_reporte id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observaciones_reporte ALTER COLUMN id SET DEFAULT nextval('public.observaciones_reporte_id_seq'::regclass);


--
-- TOC entry 3393 (class 2604 OID 26068)
-- Name: postulaciones id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones ALTER COLUMN id SET DEFAULT nextval('public.postulaciones_id_seq'::regclass);


--
-- TOC entry 3396 (class 2604 OID 26069)
-- Name: reportes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes ALTER COLUMN id SET DEFAULT nextval('public.reportes_id_seq'::regclass);


--
-- TOC entry 3400 (class 2604 OID 26070)
-- Name: residencias id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.residencias ALTER COLUMN id SET DEFAULT nextval('public.residencias_id_seq'::regclass);


--
-- TOC entry 3415 (class 2604 OID 26525)
-- Name: solicitudes_cambio_estado id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_cambio_estado ALTER COLUMN id SET DEFAULT nextval('public.solicitudes_cambio_estado_id_seq'::regclass);


--
-- TOC entry 3409 (class 2604 OID 26450)
-- Name: tokens_cuenta id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_cuenta ALTER COLUMN id SET DEFAULT nextval('public.tokens_cuenta_id_seq'::regclass);


--
-- TOC entry 3402 (class 2604 OID 26071)
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- TOC entry 3405 (class 2604 OID 26072)
-- Name: vacantes id; Type: DEFAULT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacantes ALTER COLUMN id SET DEFAULT nextval('public.vacantes_id_seq'::regclass);


--
-- TOC entry 3661 (class 0 OID 26010)
-- Dependencies: 215
-- Data for Name: alumnos; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.alumnos (id, usuario_id, matricula, carrera, semestre) FROM stdin;
1	1	21160655	Ingeniería en Sistemas Computacionales	9
2	3	21160656	Ingeniería en Sistemas Computacionales	9
4	11	23451235	Ingeniería Química	12
5	12	23451887	Ingeniería en Sistemas Computacionales	10
6	13	21160727	Ingeniería Eléctrica	10
7	14	21161923	Ingeniería Eléctrica	11
8	15	21160817	Ingeniería en Sistemas Computacionales	12
\.


--
-- TOC entry 3678 (class 0 OID 26430)
-- Dependencies: 232
-- Data for Name: docentes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.docentes (id, usuario_id, numero_empleado, departamento) FROM stdin;
1	9	2	Sistemas
2	18	5	Química
3	19	4	Eléctrica
5	21	3	Eléctrica
6	22	6	Sistemas
7	23	10	Química
8	24	11	Sistemas
\.


--
-- TOC entry 3682 (class 0 OID 26468)
-- Dependencies: 236
-- Data for Name: docentes_vacante; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.docentes_vacante (id, vacante_id, docente_id, funcion, fecha_asignacion) FROM stdin;
1	4	8	asesor	2026-11-28 01:37:46.448371
5	4	3	revisor	2026-11-28 01:37:57.924302
7	2	1	asesor	2026-11-28 01:50:45.880939
8	2	8	revisor	2026-11-28 01:50:48.640622
\.


--
-- TOC entry 3663 (class 0 OID 26014)
-- Dependencies: 217
-- Data for Name: empresas; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.empresas (id, usuario_id, nombre, descripcion, direccion, telefono, estado_republica) FROM stdin;
1	2	Empresa Demo	Empresa de desarrollo de software	Oaxaca, México	9511234567	\N
2	4	Tecnología Oaxaca	Empresa de desarrollo de software	Oaxaca, México	9511234567	\N
3	7	Embotelladora sonat	Embotellar	Santa maria	9514632548	\N
4	16	Grupo salinas	De todo	Las casas	9514634715	Puebla
5	17	empresa	a software	San felipe	9517892516	Oaxaca
\.


--
-- TOC entry 3665 (class 0 OID 26020)
-- Dependencies: 219
-- Data for Name: evaluaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.evaluaciones (id, residencia_id, calificacion, observaciones, fecha_evaluacion) FROM stdin;
1	1	95.00	El alumno demostró responsabilidad, puntualidad y excelentes habilidades técnicas durante su residencia profesional.	2026-11-22 22:24:46.679256
\.


--
-- TOC entry 3687 (class 0 OID 26562)
-- Dependencies: 241
-- Data for Name: migraciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.migraciones (nombre, fecha_aplicacion) FROM stdin;
001_coordinacion_docentes.sql	2026-11-27 03:26:33.065219
002_cuentas_inactivas.sql	2026-11-27 12:28:51.343256
003_limpiar_postulaciones.sql	2026-11-27 22:00:34.886193
004_reportes_por_equipo.sql	2026-11-27 22:14:25.701089
005_un_asesor_un_revisor.sql	2026-11-28 01:43:32.145034
\.


--
-- TOC entry 3684 (class 0 OID 26498)
-- Dependencies: 238
-- Data for Name: observaciones_reporte; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.observaciones_reporte (id, reporte_id, docente_id, tipo, pagina, contenido, fecha_creacion) FROM stdin;
\.


--
-- TOC entry 3667 (class 0 OID 26028)
-- Dependencies: 221
-- Data for Name: postulaciones; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.postulaciones (id, alumno_id, vacante_id, estado, fecha_postulacion) FROM stdin;
1	1	1	aceptado	2026-11-22 17:36:15.316329
5	5	7	pendiente	2026-11-27 20:54:14.104921
8	6	7	pendiente	2026-11-27 20:54:42.957336
15	8	2	aceptado	2026-11-27 20:55:27.303126
14	8	4	rechazado	2026-11-27 20:55:26.206354
13	8	5	rechazado	2026-11-27 20:55:25.002594
10	7	5	aceptado	2026-11-27 20:55:05.773712
6	5	2	rechazado	2026-11-27 20:54:14.894766
9	6	2	rechazado	2026-11-27 20:54:44.750168
4	4	4	aceptado	2026-11-27 20:53:19.442297
7	5	4	rechazado	2026-11-27 20:54:15.9738
\.


--
-- TOC entry 3669 (class 0 OID 26035)
-- Dependencies: 223
-- Data for Name: reportes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.reportes (id, residencia_id, numero_reporte, archivo_pdf, fecha_entrega, estado, es_ultimo, revisado_por, fecha_revision, fecha_actualizacion, vacante_id, subido_por) FROM stdin;
1	1	1	uploads\\reportes\\4d90bbe6-37b9-4e33-ab9d-d50a88a0ac28.pdf	2026-11-22 22:19:41.029935	aprobado	f	\N	\N	\N	1	1
2	3	1	uploads/reportes/61f86885-18eb-4eac-a5dc-3bfd628d5f3e.pdf	2026-11-27 22:07:38.024909	pendiente	f	\N	\N	\N	5	7
\.


--
-- TOC entry 3671 (class 0 OID 26043)
-- Dependencies: 225
-- Data for Name: residencias; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.residencias (id, postulacion_id, asesor, fecha_inicio, fecha_fin, estado) FROM stdin;
1	1	Dr. Juan Pérez	2026-12-01	2027-04-01	liberada
2	15	\N	2027-01-20	2027-08-30	en_proceso
3	10	\N	2026-11-30	2027-06-29	en_proceso
4	4	\N	2027-01-10	2027-06-30	en_proceso
\.


--
-- TOC entry 3686 (class 0 OID 26522)
-- Dependencies: 240
-- Data for Name: solicitudes_cambio_estado; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.solicitudes_cambio_estado (id, residencia_id, docente_id, estado_actual, estado_solicitado, motivo, estado, respuesta, resuelta_por, fecha_solicitud, fecha_resolucion) FROM stdin;
\.


--
-- TOC entry 3680 (class 0 OID 26447)
-- Dependencies: 234
-- Data for Name: tokens_cuenta; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.tokens_cuenta (id, usuario_id, tipo, token_hash, expira_en, usado_en, creado_en) FROM stdin;
1	9	activacion	3c07d572d3bfb259db9bd991da6aeb231107b55356ca352e40151aa76c34ccdf	2026-11-29 12:30:35.648809	2026-11-27 12:33:01.045745	2026-11-27 12:30:35.648809
2	11	activacion	e8fe6f90f12c9d6938e1e0360b2b5b3db9be2d3662cb4a23f1104172b082a651	2026-11-29 13:02:05.792234	2026-11-27 13:10:22.108783	2026-11-27 13:02:05.792234
3	12	activacion	ad097bf9e6350b1787c5b316780d705a5782ebc8b21c61d0f39e2a4e3f268ccc	2026-11-29 13:13:00.021692	2026-11-27 13:13:33.495577	2026-11-27 13:13:00.021692
4	13	activacion	8907e0982f79e3f04080bf633da283c2f2255dfdc12770d8febee8ce160183cb	2026-11-29 13:14:47.625215	2026-11-27 13:15:06.427933	2026-11-27 13:14:47.625215
5	14	activacion	885e73b9053b4ec06d97ed7a19e3d303422282e1b3c333c6ffa6a424ecf63c2f	2026-11-29 13:16:17.434656	2026-11-27 13:16:34.000482	2026-11-27 13:16:17.434656
6	15	activacion	3f13c06d1b2a6bb91ae921cf8b1a60d1451e06d5cf6b37cdccf922969323fb0e	2026-11-29 13:29:31.876899	2026-11-27 13:29:47.655599	2026-11-27 13:29:31.876899
7	16	activacion	2cc46ffb26f7e5731d124fc2859bb1eeefb516662f64d11061787b347bedc4fd	2026-11-29 14:35:26.353161	2026-11-27 14:35:45.599454	2026-11-27 14:35:26.353161
8	17	activacion	13c478a21d7f4967536600657af75192a10e8cc95b5abf63c619f76ba24560f3	2026-11-29 14:36:49.579377	2026-11-27 14:37:02.388996	2026-11-27 14:36:49.579377
9	18	activacion	2d2b3143b72f06844e0ab2dda66168f14bd4ff971df926e08730906016f5a873	2026-11-29 14:38:06.723506	2026-11-27 14:38:18.772449	2026-11-27 14:38:06.723506
10	19	activacion	721e89671610f4a686a27205d83c48187795b3f0a7e5ae9a4da4a4d3339c4a11	2026-11-29 14:43:27.574421	2026-11-27 14:43:40.231351	2026-11-27 14:43:27.574421
11	21	activacion	d52d48e53d25eb1f6be8a2dedea7dacf6067a731770a90e662a30c1c37e3696b	2026-11-29 14:44:27.41041	2026-11-27 14:44:40.612665	2026-11-27 14:44:27.41041
12	22	activacion	208272d78fd37237228bc47cefd612e903fae0f57366a6a958bac9c2eae947b9	2026-11-29 14:45:22.091514	2026-11-27 14:45:33.302261	2026-11-27 14:45:22.091514
13	23	activacion	f1a9379c730cfd237b4ab6d1bac32ba3c0190ebaf29e07869cae55374d032748	2026-11-29 14:51:44.001991	2026-11-27 14:54:07.361721	2026-11-27 14:51:44.001991
14	24	activacion	75cccdf8e9d91a5c20fa8e306db336490edd1f18feddd3fb4a967bfb6ac9e57f	2026-11-29 15:12:37.373101	2026-11-27 15:12:47.997977	2026-11-27 15:12:37.373101
\.


--
-- TOC entry 3673 (class 0 OID 26049)
-- Dependencies: 227
-- Data for Name: usuarios; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.usuarios (id, nombre, correo, password, rol, fecha_registro, estado_cuenta, creado_por, fecha_actualizacion, fecha_desactivacion) FROM stdin;
1	Miguel Gonzalez	alumno.prueba@itoaxaca.edu.mx	$2b$12$HHm5iv9HT3J9u38u4zIWreBVxO0xNg4KlZwWTd1SIGY9QQ55Iu.mW	alumno	2026-11-22 17:20:51.419501	activa	\N	\N	\N
2	Empresa Demo	empresa@resiito.com	$2b$12$FOR1eu/JXSfanbtd.6Dagu3ZYGskFj7sp2sSV0fd38tpnKkZ4bX76	empresa	2026-11-22 17:24:36.922163	activa	\N	\N	\N
3	Alumno Nuevo	alumno2@itoaxaca.edu.mx	$2b$12$UFKhh2oLHj.Idl/nen.VM.4N1gRABhIBfcdHTfmSIsz1.h7sCVtei	alumno	2026-11-22 22:03:58.215583	activa	\N	\N	\N
4	Representante Empresa	empresa2@resiito.com	$2b$12$rWNpVGC7JqhW.4GSPZ0qTuUbmuarRKWRpkNdU.uZUL7u1tzKwGGv.	empresa	2026-11-22 22:05:03.728425	activa	\N	\N	\N
5	Coordinador Demo	coordinador@resiito.com	$2b$12$G8RCfcI11JftHjjOrXNob.gyGUgemHgB9i7MU50XYdp/h0jSHkOsa	coordinador	2026-11-22 22:08:07.323963	activa	\N	\N	\N
7	Raul Jimenez	empresa@prueba.com	$2b$12$ggI19Mvn3SWoVYeWTGoBd.iL6W4imYMTxvP.MC6snPdLbu7ANBSIS	empresa	2026-11-26 11:00:09.738975	activa	\N	\N	\N
8	Hector Aramis Vera Acevedo	rayhava541@gmail.com	$2b$12$7WhV2YEQr6SplrsC/aIC0OmOLD8RTh5mIefmhtC1K7PIzrgwyLVG.	coordinador	2026-11-27 03:27:54.442977	activa	\N	\N	\N
9	Juan Patricio Flores	21160819@itoaxaca.edu.mx	$2b$12$QoBPADucegoykbAdTcuRQONci1G0vPQw0SI7ljI3kPcS9VeZ7aXLW	docente	2026-11-27 12:30:35.648809	activa	8	\N	\N
10	Coordinador Prueba	coordinador@gmail.com	$2b$12$daLbK0X09QYm7sDmqWx6veTwz2culJHiGgkGTN2UV.uGGmo4RxwI.	coordinador	2026-11-27 12:48:47.292017	activa	\N	\N	\N
11	Jose Hernandez	joseh@gmail.com	$2b$12$ZeplGRzqnNF/PkNRTkqI1O5m9xGtG4J2puUgG8k0U0mPtIHA8zS0a	alumno	2026-11-27 13:02:05.792234	activa	10	\N	\N
12	Pancho Villa	panchov@gmail.com	$2b$12$XJq4H1q1f6DkmvR2RyZc1edajCJYs/G5E/YcB6rdU4vrNY.HQ7jc6	alumno	2026-11-27 13:13:00.021692	activa	10	\N	\N
13	Dagoberto Francisco	dagofran@gmail.com	$2b$12$VDJgefnCNDDC1a5pQGwO/e29hbIieH6/DL5avJSB6t2h1KI8uhPk.	alumno	2026-11-27 13:14:47.625215	activa	10	\N	\N
14	Nala Sarmiento	nalas@gmail.com	$2b$12$brCEL4XiP2ZqSf3hs7chH.IIorRPHWcL7HyOskbIU5M3E.lqsSmgu	alumno	2026-11-27 13:16:17.434656	activa	10	\N	\N
15	Ricardo Hernandez	ricardoh@gmail.com	$2b$12$qPL4s6.u4lqDLkHOGc7DK.JpVGIASZcJhPrv5snO2BokfQRIGQfZm	alumno	2026-11-27 13:29:31.876899	activa	10	\N	\N
16	Ricardo salinas	salida@gmail.com	$2b$12$G5/Zn6eBgRbl0m02qhjam.pn8CZnc1LAwPLCiOIwb.l9gC4sIayIy	empresa	2026-11-27 14:35:26.353161	activa	10	\N	\N
17	empresa de prueba	empresa@gmail.com	$2b$12$VH93t8piIZ14fLqwMKKVjeRleTN3O48ZfiFbzVrbcg0qa5ise5DPe	empresa	2026-11-27 14:36:49.579377	activa	10	\N	\N
18	Roberto Lopez	robertol@gmail.com	$2b$12$0sNmsNL7t19PGGOX1J5k1.lftCpL9et3i6mM/hmaQAMomn8hxWTwy	docente	2026-11-27 14:38:06.723506	activa	10	\N	\N
19	Alfredo Pacheco	alfredop@gmail.com	$2b$12$ICi78t2afZW4JwT2FFwS3uRRFsZZXtR2OUyDzZG/iI.GlWZ6qdpMu	docente	2026-11-27 14:43:27.574421	activa	10	\N	\N
21	Mario Hernandez	marioh@gmail.com	$2b$12$CGi/.iOuJ6Evuiw.TE6WqOXjAXd2YDyxoWEn6oRpBFFpNsQ92TvPO	docente	2026-11-27 14:44:27.41041	activa	10	\N	\N
22	Rosa Aguilar	rosaa@gmail.com	$2b$12$K2jbuKPF409h4s.T/7GW5On/6UEZBSZiD13943j5r7XXpN2Ctzc6O	docente	2026-11-27 14:45:22.091514	activa	10	\N	\N
23	Jocelyn Jimenez	jocej@gmail.com	$2b$12$9z5DAAqc8zRMIOhCVUPjtOrlBpHq0OzYlEWOQjJz1IBfJy9UQNha.	docente	2026-11-27 14:51:44.001991	activa	10	2026-11-27 15:11:57.406154	\N
24	Sarai Gomez	sarag@gmail.com	$2b$12$7laTYomKSdMUv.wGJriyFu562GHEYteyn6vnmaxqI5UIGAFKNPt46	docente	2026-11-27 15:12:37.373101	activa	10	\N	\N
\.


--
-- TOC entry 3675 (class 0 OID 26057)
-- Dependencies: 229
-- Data for Name: vacantes; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.vacantes (id, empresa_id, titulo, descripcion, carrera, requisitos, estado, fecha_publicacion, cupo, motivo_rechazo, fecha_revision) FROM stdin;
1	1	Desarrollador Full Stack	Desarrollo frontend y backend.	Ingeniería en Sistemas Computacionales	React, Node.js y PostgreSQL	activa	2026-11-22 17:29:13.752513	1	\N	\N
2	3	Creación de un gestor de procesos para embazado	Queremos un gestor de embazado interno	Ingeniería en Sistemas Computacionales	Que podamos hacer todos los procesos de la empresa desde la aplicación	activa	2026-11-26 11:01:29.791387	1	\N	\N
3	3	Sistema de inventarios	Crear un sistema completo de inventarios desde el manejo de productos hasta el control de empleados	Ingeniería en Sistemas Computacionales	Usar lenguaje Java, base de datos en postgres y que sea en la nube	pendiente	2026-11-27 15:17:59.658683	\N	\N	\N
6	3	Aplicación para firmas electrónicas	Para firmar documentos digitalmente	Ingeniería en Sistemas Computacionales	Dos alumnos de sistemas	pendiente	2026-11-27 15:42:00.026985	\N	\N	\N
7	3	Plataforma infantil para la enseñanza	Crear una plataforma con juegos y libros que puedan usar los niños	Ingeniería en Sistemas Computacionales	Que la plataforma sea dinámica y fácil de entender	activa	2026-11-27 15:42:55.655649	3	\N	2026-11-27 18:14:33.512189
5	3	Diseño de robot para lucha de zumo	Diseño y creación de un robot zumo	Ingeniería Eléctrica	Ser de eléctrica	activa	2026-11-27 15:33:29.656126	2	\N	2026-11-27 18:21:16.717336
4	3	Control de almacén en laboratorio	Gestionar la entrega y recibimiento de herramienta en laboratorio	Ingeniería Química	Saber sobre herramientas de laboratorio	activa	2026-11-27 15:29:01.894048	1	\N	2026-11-27 18:21:20.126732
\.


--
-- TOC entry 3706 (class 0 OID 0)
-- Dependencies: 216
-- Name: alumnos_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.alumnos_id_seq', 8, true);


--
-- TOC entry 3707 (class 0 OID 0)
-- Dependencies: 231
-- Name: docentes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.docentes_id_seq', 8, true);


--
-- TOC entry 3708 (class 0 OID 0)
-- Dependencies: 235
-- Name: docentes_vacante_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.docentes_vacante_id_seq', 8, true);


--
-- TOC entry 3709 (class 0 OID 0)
-- Dependencies: 218
-- Name: empresas_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.empresas_id_seq', 5, true);


--
-- TOC entry 3710 (class 0 OID 0)
-- Dependencies: 220
-- Name: evaluaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.evaluaciones_id_seq', 1, true);


--
-- TOC entry 3711 (class 0 OID 0)
-- Dependencies: 237
-- Name: observaciones_reporte_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.observaciones_reporte_id_seq', 1, false);


--
-- TOC entry 3712 (class 0 OID 0)
-- Dependencies: 222
-- Name: postulaciones_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.postulaciones_id_seq', 15, true);


--
-- TOC entry 3713 (class 0 OID 0)
-- Dependencies: 224
-- Name: reportes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.reportes_id_seq', 2, true);


--
-- TOC entry 3714 (class 0 OID 0)
-- Dependencies: 226
-- Name: residencias_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.residencias_id_seq', 4, true);


--
-- TOC entry 3715 (class 0 OID 0)
-- Dependencies: 239
-- Name: solicitudes_cambio_estado_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.solicitudes_cambio_estado_id_seq', 1, false);


--
-- TOC entry 3716 (class 0 OID 0)
-- Dependencies: 233
-- Name: tokens_cuenta_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.tokens_cuenta_id_seq', 14, true);


--
-- TOC entry 3717 (class 0 OID 0)
-- Dependencies: 228
-- Name: usuarios_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.usuarios_id_seq', 24, true);


--
-- TOC entry 3718 (class 0 OID 0)
-- Dependencies: 230
-- Name: vacantes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.vacantes_id_seq', 7, true);


--
-- TOC entry 3440 (class 2606 OID 26074)
-- Name: alumnos alumnos_matricula_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_matricula_key UNIQUE (matricula);


--
-- TOC entry 3442 (class 2606 OID 26076)
-- Name: alumnos alumnos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_pkey PRIMARY KEY (id);


--
-- TOC entry 3444 (class 2606 OID 26078)
-- Name: alumnos alumnos_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_usuario_id_key UNIQUE (usuario_id);


--
-- TOC entry 3473 (class 2606 OID 26439)
-- Name: docentes docentes_numero_empleado_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_numero_empleado_key UNIQUE (numero_empleado);


--
-- TOC entry 3475 (class 2606 OID 26435)
-- Name: docentes docentes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_pkey PRIMARY KEY (id);


--
-- TOC entry 3477 (class 2606 OID 26437)
-- Name: docentes docentes_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_usuario_id_key UNIQUE (usuario_id);


--
-- TOC entry 3485 (class 2606 OID 26475)
-- Name: docentes_vacante docentes_vacante_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes_vacante
    ADD CONSTRAINT docentes_vacante_pkey PRIMARY KEY (id);


--
-- TOC entry 3488 (class 2606 OID 26477)
-- Name: docentes_vacante docentes_vacante_vacante_id_docente_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes_vacante
    ADD CONSTRAINT docentes_vacante_vacante_id_docente_id_key UNIQUE (vacante_id, docente_id);


--
-- TOC entry 3446 (class 2606 OID 26080)
-- Name: empresas empresas_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_pkey PRIMARY KEY (id);


--
-- TOC entry 3448 (class 2606 OID 26082)
-- Name: empresas empresas_usuario_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_usuario_id_key UNIQUE (usuario_id);


--
-- TOC entry 3450 (class 2606 OID 26084)
-- Name: evaluaciones evaluaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3452 (class 2606 OID 26086)
-- Name: evaluaciones evaluaciones_residencia_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_residencia_id_key UNIQUE (residencia_id);


--
-- TOC entry 3496 (class 2606 OID 26567)
-- Name: migraciones migraciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.migraciones
    ADD CONSTRAINT migraciones_pkey PRIMARY KEY (nombre);


--
-- TOC entry 3490 (class 2606 OID 26509)
-- Name: observaciones_reporte observaciones_reporte_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observaciones_reporte
    ADD CONSTRAINT observaciones_reporte_pkey PRIMARY KEY (id);


--
-- TOC entry 3454 (class 2606 OID 26088)
-- Name: postulaciones postulaciones_alumno_id_vacante_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_alumno_id_vacante_id_key UNIQUE (alumno_id, vacante_id);


--
-- TOC entry 3456 (class 2606 OID 26090)
-- Name: postulaciones postulaciones_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_pkey PRIMARY KEY (id);


--
-- TOC entry 3458 (class 2606 OID 26092)
-- Name: reportes reportes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_pkey PRIMARY KEY (id);


--
-- TOC entry 3460 (class 2606 OID 26872)
-- Name: reportes reportes_vacante_id_numero_reporte_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_vacante_id_numero_reporte_key UNIQUE (vacante_id, numero_reporte);


--
-- TOC entry 3463 (class 2606 OID 26096)
-- Name: residencias residencias_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.residencias
    ADD CONSTRAINT residencias_pkey PRIMARY KEY (id);


--
-- TOC entry 3465 (class 2606 OID 26098)
-- Name: residencias residencias_postulacion_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.residencias
    ADD CONSTRAINT residencias_postulacion_id_key UNIQUE (postulacion_id);


--
-- TOC entry 3493 (class 2606 OID 26535)
-- Name: solicitudes_cambio_estado solicitudes_cambio_estado_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_cambio_estado
    ADD CONSTRAINT solicitudes_cambio_estado_pkey PRIMARY KEY (id);


--
-- TOC entry 3479 (class 2606 OID 26454)
-- Name: tokens_cuenta tokens_cuenta_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_cuenta
    ADD CONSTRAINT tokens_cuenta_pkey PRIMARY KEY (id);


--
-- TOC entry 3481 (class 2606 OID 26456)
-- Name: tokens_cuenta tokens_cuenta_token_hash_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_cuenta
    ADD CONSTRAINT tokens_cuenta_token_hash_key UNIQUE (token_hash);


--
-- TOC entry 3467 (class 2606 OID 26100)
-- Name: usuarios usuarios_correo_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_correo_key UNIQUE (correo);


--
-- TOC entry 3469 (class 2606 OID 26102)
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- TOC entry 3471 (class 2606 OID 26104)
-- Name: vacantes vacantes_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacantes
    ADD CONSTRAINT vacantes_pkey PRIMARY KEY (id);


--
-- TOC entry 3483 (class 1259 OID 26488)
-- Name: docentes_vacante_docente_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX docentes_vacante_docente_idx ON public.docentes_vacante USING btree (docente_id);


--
-- TOC entry 3486 (class 1259 OID 26873)
-- Name: docentes_vacante_una_funcion_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX docentes_vacante_una_funcion_idx ON public.docentes_vacante USING btree (vacante_id, funcion);


--
-- TOC entry 3491 (class 1259 OID 26520)
-- Name: observaciones_reporte_reporte_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX observaciones_reporte_reporte_idx ON public.observaciones_reporte USING btree (reporte_id);


--
-- TOC entry 3461 (class 1259 OID 26866)
-- Name: reportes_vacante_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX reportes_vacante_idx ON public.reportes USING btree (vacante_id);


--
-- TOC entry 3494 (class 1259 OID 26551)
-- Name: solicitudes_una_pendiente_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE UNIQUE INDEX solicitudes_una_pendiente_idx ON public.solicitudes_cambio_estado USING btree (residencia_id) WHERE ((estado)::text = 'pendiente'::text);


--
-- TOC entry 3482 (class 1259 OID 26462)
-- Name: tokens_cuenta_usuario_idx; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX tokens_cuenta_usuario_idx ON public.tokens_cuenta USING btree (usuario_id, tipo);


--
-- TOC entry 3497 (class 2606 OID 26105)
-- Name: alumnos alumnos_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alumnos
    ADD CONSTRAINT alumnos_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 3509 (class 2606 OID 26440)
-- Name: docentes docentes_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes
    ADD CONSTRAINT docentes_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 3511 (class 2606 OID 26483)
-- Name: docentes_vacante docentes_vacante_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes_vacante
    ADD CONSTRAINT docentes_vacante_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id) ON DELETE CASCADE;


--
-- TOC entry 3512 (class 2606 OID 26478)
-- Name: docentes_vacante docentes_vacante_vacante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.docentes_vacante
    ADD CONSTRAINT docentes_vacante_vacante_id_fkey FOREIGN KEY (vacante_id) REFERENCES public.vacantes(id) ON DELETE CASCADE;


--
-- TOC entry 3498 (class 2606 OID 26110)
-- Name: empresas empresas_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.empresas
    ADD CONSTRAINT empresas_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id);


--
-- TOC entry 3499 (class 2606 OID 26115)
-- Name: evaluaciones evaluaciones_residencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.evaluaciones
    ADD CONSTRAINT evaluaciones_residencia_id_fkey FOREIGN KEY (residencia_id) REFERENCES public.residencias(id);


--
-- TOC entry 3513 (class 2606 OID 26515)
-- Name: observaciones_reporte observaciones_reporte_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observaciones_reporte
    ADD CONSTRAINT observaciones_reporte_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id);


--
-- TOC entry 3514 (class 2606 OID 26510)
-- Name: observaciones_reporte observaciones_reporte_reporte_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.observaciones_reporte
    ADD CONSTRAINT observaciones_reporte_reporte_id_fkey FOREIGN KEY (reporte_id) REFERENCES public.reportes(id) ON DELETE CASCADE;


--
-- TOC entry 3500 (class 2606 OID 26120)
-- Name: postulaciones postulaciones_alumno_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_alumno_id_fkey FOREIGN KEY (alumno_id) REFERENCES public.alumnos(id);


--
-- TOC entry 3501 (class 2606 OID 26125)
-- Name: postulaciones postulaciones_vacante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.postulaciones
    ADD CONSTRAINT postulaciones_vacante_id_fkey FOREIGN KEY (vacante_id) REFERENCES public.vacantes(id);


--
-- TOC entry 3502 (class 2606 OID 26130)
-- Name: reportes reportes_residencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_residencia_id_fkey FOREIGN KEY (residencia_id) REFERENCES public.residencias(id);


--
-- TOC entry 3503 (class 2606 OID 26491)
-- Name: reportes reportes_revisado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_revisado_por_fkey FOREIGN KEY (revisado_por) REFERENCES public.docentes(id);


--
-- TOC entry 3504 (class 2606 OID 26859)
-- Name: reportes reportes_subido_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_subido_por_fkey FOREIGN KEY (subido_por) REFERENCES public.alumnos(id);


--
-- TOC entry 3505 (class 2606 OID 26854)
-- Name: reportes reportes_vacante_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.reportes
    ADD CONSTRAINT reportes_vacante_id_fkey FOREIGN KEY (vacante_id) REFERENCES public.vacantes(id);


--
-- TOC entry 3506 (class 2606 OID 26135)
-- Name: residencias residencias_postulacion_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.residencias
    ADD CONSTRAINT residencias_postulacion_id_fkey FOREIGN KEY (postulacion_id) REFERENCES public.postulaciones(id);


--
-- TOC entry 3515 (class 2606 OID 26541)
-- Name: solicitudes_cambio_estado solicitudes_cambio_estado_docente_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_cambio_estado
    ADD CONSTRAINT solicitudes_cambio_estado_docente_id_fkey FOREIGN KEY (docente_id) REFERENCES public.docentes(id);


--
-- TOC entry 3516 (class 2606 OID 26536)
-- Name: solicitudes_cambio_estado solicitudes_cambio_estado_residencia_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_cambio_estado
    ADD CONSTRAINT solicitudes_cambio_estado_residencia_id_fkey FOREIGN KEY (residencia_id) REFERENCES public.residencias(id) ON DELETE CASCADE;


--
-- TOC entry 3517 (class 2606 OID 26546)
-- Name: solicitudes_cambio_estado solicitudes_cambio_estado_resuelta_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.solicitudes_cambio_estado
    ADD CONSTRAINT solicitudes_cambio_estado_resuelta_por_fkey FOREIGN KEY (resuelta_por) REFERENCES public.usuarios(id);


--
-- TOC entry 3510 (class 2606 OID 26457)
-- Name: tokens_cuenta tokens_cuenta_usuario_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tokens_cuenta
    ADD CONSTRAINT tokens_cuenta_usuario_id_fkey FOREIGN KEY (usuario_id) REFERENCES public.usuarios(id) ON DELETE CASCADE;


--
-- TOC entry 3507 (class 2606 OID 26424)
-- Name: usuarios usuarios_creado_por_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_creado_por_fkey FOREIGN KEY (creado_por) REFERENCES public.usuarios(id);


--
-- TOC entry 3508 (class 2606 OID 26140)
-- Name: vacantes vacantes_empresa_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.vacantes
    ADD CONSTRAINT vacantes_empresa_id_fkey FOREIGN KEY (empresa_id) REFERENCES public.empresas(id);


-- Completed on 2026-11-28 02:29:50 CST

--
-- PostgreSQL database dump complete
--

\unrestrict b0oFAfGpWirioLbRX5PQOQWIaicJf99hhxldiRzG6TEx9lU4yhh6r30fSNZ4hNA

