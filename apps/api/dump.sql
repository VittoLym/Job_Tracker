--
-- PostgreSQL database dump
--

\restrict bxKMwAbvgJFTrHQaMu3AHi1LTh2foLPQWrTH25ap4ux9WOBX5DSi21C6iQGHHwO

-- Dumped from database version 18.4
-- Dumped by pg_dump version 18.4

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

--
-- Data for Name: Application; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Application" (id, company, role, url, status, "workMode", salary, notes, "appliedAt", "createdAt", "updatedAt") FROM stdin;
768a6a1a-34c3-496c-9afb-e7017cf6d352	C&S informatica	Desarrollador Backend Python Fast API SR	https://ar.computrabajo.com/trabajo-de-developer#DA6428750883AF1761373E686DCF3405	APPLIED	REMOTE	3000	\N	2026-07-23 23:30:54.7	2026-07-23 23:30:54.7	2026-07-23 23:30:54.7
28dcf9d2-f832-47a8-ba64-d369b87feb20	C&S Informática	Backend Engineer Senior	https://candidato.ar.computrabajo.com/candidate/match/comparison/?im=FC812A1538A64362729B5ABEB8365A48	ASSESSMENT	ONSITE	2000	Compu trabajo, postulado el 22/07/26 vieron el cv	2026-07-22 00:21:54.867	2026-07-22 00:21:54.867	2026-07-22 00:22:21.618
ec22f22e-0de5-4456-a21c-fea881a5c1a6	America Virtual	Java Dev Senior	\N	INTERVIEW	REMOTE	4000	era semi-remoto en Belgrano y no soy bueno en java aun	2026-07-22 00:26:40.971	2026-07-22 00:26:40.971	2026-07-22 00:26:40.971
2c1db220-7046-4937-8829-6c72a6877800	CodingIT	Javascript Developer	\N	OFFER	REMOTE	4000	no se pudo, por incomodidades personales, pero estuvo bien	2026-07-22 00:28:21.544	2026-07-22 00:28:21.544	2026-07-22 00:28:21.544
6dc6111b-1cbc-467f-9773-0f9dcbcf7355	Empresa Cordobesa	Desarrollador Web FullStack	https://ar.computrabajo.com/trabajo-de-developer#EC4B408C4A362E9861373E686DCF3405	APPLIED	REMOTE	2000	\N	2026-07-22 00:30:45.079	2026-07-22 00:30:45.079	2026-07-22 00:30:45.079
b4bb9a5a-fad6-4da9-bbfe-a13477029eaf	Kaizen RH	Senior Backend Python Developer	https://ar.computrabajo.com/trabajo-de-developer#3F97F1DE9E56511561373E686DCF3405	APPLIED	ONSITE	2000	\N	2026-07-22 00:31:40.092	2026-07-22 00:31:40.092	2026-07-22 00:31:40.092
57e5a902-5a6a-4bcc-b539-dd6a4623edcb	ADN RH	Senior Full Stack DeveloperZ	https://ar.computrabajo.com/trabajo-de-developer#B6CE3667F0EC9B9D61373E686DCF3405	APPLIED	REMOTE	2000	\N	2026-07-22 00:33:10.026	2026-07-22 00:33:10.026	2026-07-22 00:33:10.026
9e4b2e06-1c0d-46a1-8166-c318991d320e	ADN RH	Full-Stack Java con Kotlin	https://candidato.ar.computrabajo.com/candidate/match/comparison/?im=FEA0F434562A240222F4CD5CFFB3D40B	GHOSTED	ONSITE	2000	Aplicado 21/07/26 	2026-07-22 00:23:49.825	2026-07-22 00:23:49.825	2026-07-22 00:33:29.866
36e2a006-5ed5-451d-a234-01abdcb75cf2	ADN RH	Python Dev | Fast Api	https://candidato.ar.computrabajo.com/candidate/match/comparison/?im=EC8FDF79D474613058C0762E53B054AF	GHOSTED	REMOTE	2000	aplicado 25/07/26, no han visto el cv	2026-07-22 00:25:16.045	2026-07-22 00:25:16.045	2026-07-22 00:33:38.499
77754ecd-d84b-4d96-aed8-a7f1fa5bfbe8	Koin Limited	AI Product Engineer	https://www.linkedin.com/jobs/view/4444474140/?alternateChannel=search&eBP=NOT_ELIGIBLE_FOR_CHARGING&refId=%2BB205jkyUypHGkvoopphtg%3D%3D&trackingId=vgas62y1zVSX3pnjYI6NBQ%3D%3D	APPLIED	REMOTE	4000	\N	2026-07-23 23:08:46.841	2026-07-23 23:08:46.841	2026-07-23 23:08:46.841
7512427a-b274-4a27-9ae0-0951ad6f924a	Yuno	Backend Developer	https://www.linkedin.com/jobs/view/4440387636/?alternateChannel=search&eBP=NOT_ELIGIBLE_FOR_CHARGING&refId=%2BNEytDg8IeiYWaIoFd6Krw%3D%3D&trackingId=sn29PXZCQ15eKTruPQpXZQ%3D%3D	APPLIED	REMOTE	3500	\N	2026-07-23 23:12:40.781	2026-07-23 23:12:40.781	2026-07-23 23:12:40.781
39480f65-3889-4a6b-bb86-8ba98735efbd	Despegar	Software Engineer II - Back End	https://www.linkedin.com/jobs/view/4427093637/?alternateChannel=search&eBP=NOT_ELIGIBLE_FOR_CHARGING&refId=QVVwg3hBqjTsWFoXVoj47A%3D%3D&trackingId=y9LdeyScGWx9BDymaJozQg%3D%3D	APPLIED	REMOTE	3500	\N	2026-07-23 23:15:25.94	2026-07-23 23:15:25.94	2026-07-23 23:15:25.94
ee8f8592-7863-4646-acd1-e42e98c71e87	CRAFT labs	Python Developer	https://www.linkedin.com/jobs/view/4439073634/?alternateChannel=search&eBP=CwEAAAGfkUNqUhlNfwRxROWlFMyP_UdfSd02rAFO7kRGuJq6AP9eGBh0xRnTsQUk41ZVLK_-FJicgZ2jy86DRP4QmpCUFZi82hOk0x7WvR2e4IZt6u2FJGiIPNBCd-I6RXjiLhr90v5RrC75_cAaSv3EAYDkYfPxGJ6AMi3ckiSwBQ9Ku2Y6aj87lEWcKBES7pd8vDIXVvHlYLop2Ua54SDaTJbSGQf473T7QUsXS_FhjoLz2XZVxJe4m4q3yY-IKbsno0o_REUOuaZ-3I0jIcttuIsbNL_20eJ9Zjy0BuuPk8oOLB_NZNwpllE_hdzCxfyXteSlvu2pWsTcd6rI8V0OlG0Hs7BtBVZPP71paLgI6iULVieE8QZaIkavbEb1E3XV-TfJYGaTgTzEppxnldXwbReL1ZjxvqKsRq6US9bgmolfWd6Z85-VFxO4oKPULzKbJDJ4kK-VqEd7KSQAA04SrGz2nK-GDD4RGqf4VffMXP6JRnLz&refId=LKez%2BofFYB7wacTpBImESg%3D%3D&trackingId=Mu3t3KKHc0X3Gj0bOoC6gQ%3D%3D	APPLIED	ONSITE	3500	\N	2026-07-23 23:21:16.943	2026-07-23 23:21:16.943	2026-07-23 23:21:16.943
710e6f4f-cdb7-4cac-bf76-112f06ad572b	Azumo	Fullstack JavaScript Developer	https://www.linkedin.com/jobs/view/4399442828/?alternateChannel=search&eBP=NOT_ELIGIBLE_FOR_CHARGING&refId=4IXZ%2BPlIFPZeeU3I1xrxDg%3D%3D&trackingId=XZg2k2P9Y7j5XIomIxrCBg%3D%3D	APPLIED	REMOTE	3500	\N	2026-07-23 23:26:08.819	2026-07-23 23:26:08.819	2026-07-23 23:26:08.819
8bb91659-6f1c-4fc3-9eeb-027a969e7659	oowlish	Full Stack Web Engineer (Python & React)	https://www.linkedin.com/jobs/view/4437434351/?alternateChannel=search&eBP=NOT_ELIGIBLE_FOR_CHARGING&refId=Vch8OpTQb3kgc9dtaBfBHA%3D%3D&trackingId=hSGQouJAsbKFVqS6I49xZQ%3D%3D	APPLIED	REMOTE	3500	\N	2026-07-23 23:24:32.137	2026-07-23 23:24:32.137	2026-07-23 23:26:20.212
3271083b-1351-470e-9bd2-bcdb78ac9daf	Wakapi	Backend Engineer	https://www.linkedin.com/jobs/view/4437994611/?alternateChannel=search&eBP=NOT_ELIGIBLE_FOR_CHARGING&refId=vROKSPRR80I1k4dGAnq7SQ%3D%3D&trackingId=UUov6UaX3TbJTIxRwBmxlw%3D%3D	APPLIED	REMOTE	3500	\N	2026-07-23 23:28:58.931	2026-07-23 23:28:58.931	2026-07-23 23:28:58.931
e6237b8f-e555-4c4b-8630-3320e68a74c5	C&S informatica	Desarrollador Front React Next Js S	https://ar.computrabajo.com/trabajo-de-developer#BBC19379DB48BC4761373E686DCF3405	APPLIED	REMOTE	3000	\N	2026-07-23 23:32:00.144	2026-07-23 23:32:00.144	2026-07-23 23:32:00.144
7227ff31-8394-4636-a0ba-ca8e8fda1954	PedidosYa	Sr Software Engineer Backend 	https://www.linkedin.com/jobs/view/4430574515/?alternateChannel=search&eBP=CwEAAAGfqr9nv_iLZzWU56-DOtiUwkQ2k0r8hvldHO-8QS2kt4jBRA2fNnBQZhNptDuIQUdsJlRM0UmF6g-SHtLAcQlWypXoe7MldG0NxP7ybs6PHSQ1ULtwRzzubYt3SZopNDJOvgH4kk4YP8hl_5QlA4MgCGNpMrjn9fndqokD7LDdlDbetA0tpEr7TV5pXCo-qxLh4YW6S7sYsN9WAcP8c2DdzMPTK417eASHm-jmsI_infHXqYPZr4-2ApdEMLR-Kx7xz7E_FYPMkDbARqPR52EaPbCFnwi3V_tyHu-GaTVh8KxauESgzxqF9v4opNkni6l6EsKhJJgyinFOjugSXo-zBjj0fofv-plVhwMHyr47mcud-6GQXujbYdVvS-rcKSs9esbb8xNqgoRt6Iad8UWm-SyBSs_FyAgQ-52k6YSai36_1LBYXKu1fcMBCOFks8QQ195Dp8cy6bMdyPAr3uw_sdLNaa31s4hiA0bZOo0&refId=2sWsWUet73eu6wEfz46UbA%3D%3D&trackingId=PSyU9eSObvn0J69J6xDNzw%3D%3D	APPLIED	REMOTE	2000	\N	2026-07-29 00:37:54.231	2026-07-29 00:37:54.231	2026-07-29 00:37:54.231
efe1d524-16dd-4725-9674-883b81492f61	Fintech Platform (Confidential)	Se ha enviado tu solicitud a Fintech Platform (Confidential). ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏	\N	APPLIED	\N	\N	Creado automáticamente desde LinkedIn	2026-07-29 00:52:49.033	2026-07-29 00:52:49.033	2026-07-29 00:52:49.033
5cff55c4-7258-4c5b-bfeb-d9f9898ba730	Softgic	Se ha enviado tu solicitud a Softgic. ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏	\N	APPLIED	\N	\N	Creado automáticamente desde LinkedIn	2026-07-29 01:06:48.454	2026-07-29 01:06:48.454	2026-07-29 01:06:48.454
70c1f88a-bd2d-40a4-950e-4cdc1d00c4a4	Getronics	Se ha enviado tu solicitud a Getronics. ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏ ͏	\N	APPLIED	\N	\N	Creado automáticamente desde LinkedIn	2026-07-29 01:36:22.01	2026-07-29 01:36:22.01	2026-07-29 01:36:22.01
983b1215-01a2-4651-9ee6-0a2ca58b7168	Flatiron Software	Se ha enviado tu solicitud a Flatiron Software.	\N	APPLIED	\N	\N	Creado automáticamente desde LinkedIn	2026-07-29 01:43:31.658	2026-07-29 01:43:31.658	2026-07-29 01:43:31.658
5d3d8d18-4054-45a8-ac4b-9bbc1f491878	Coderio		\N	APPLIED	\N	\N	Creado automáticamente desde LinkedIn	2026-07-29 01:55:08.266	2026-07-29 01:55:08.266	2026-07-29 01:55:08.266
7e8d37d1-467f-4f1d-beb4-6408b0ff9ea4	AYIGROUP		\N	APPLIED	\N	\N	Creado automáticamente desde LinkedIn	2026-07-29 01:57:52.626	2026-07-29 01:57:52.626	2026-07-29 01:57:52.626
dc4a4b70-d2b1-429d-bdb6-474519435d6f	Stefanini Group	Stefanini Group	\N	APPLIED	REMOTE	\N	Creado automáticamente desde LinkedIn	2026-07-29 02:04:46.551	2026-07-29 02:04:46.551	2026-07-29 02:04:46.551
0193a0a6-3a32-4029-874e-1cd4a908e864	Avenue Code	Senior Software Engineer (Backend)	\N	APPLIED	REMOTE	\N	Creado automáticamente desde LinkedIn	2026-07-29 02:11:25.787	2026-07-29 02:11:25.787	2026-07-29 02:11:25.787
50b15030-7fd6-44ab-af3a-cd7441b612da	GlobalLogic	Python Developer	\N	APPLIED	REMOTE	\N	Creado automáticamente desde LinkedIn	2026-07-29 02:24:40.567	2026-07-29 02:24:40.567	2026-07-29 02:24:40.567
1ec2014f-27d6-4bc0-9595-b3544b8a58f2	CRAFTLabs	Full Stack Developer	https://www.linkedin.com/comm/jobs/view/4439086399/?trackingId=QANPwB9mRZeEZuxR4bdedw%3D%3D&refId=zvHwDVLCQzS3iSZ1MwaI9w%3D%3D&lipi=urn%3Ali%3Apage%3Aemail_email_application_confirmation_with_nba_01%3BusLhrO8lSVSN563tZRkbBA%3D%3D&midToken=AQE4bm2SsPUZeA&midSig=2k8aM7siTP1so1&trk=eml-email_application_confirmation_with_nba_01-application~confirmation-0-view_job&trkEmail=eml-email_application_confirmation_with_nba_01-application~confirmation-0-view_job-null-l16dt0~ms5gscln~wj-null-null&eid=l16dt0-ms5gscln-wj&otpToken=Y2JlN2ZlMjU1YmM2MDIxZDc4ZTQ4ZGRlMzBhMDNmYTc2ZmU2MTZlMGI3OWUyOWNlYzkyZTNlNWVlYWVlNTJhMmZjYTU4ZDI3OGE0MDVkNmI4OWMwZTM3OWY4ZDIxNzgxNDkxM2RjOWYxNTk0YTc0Nzg3Y2M0MDM3ZDRiZjk1NThhZmFhMTI5NjQ3MjkyYzE5LDIsMQ%3D%3D	APPLIED	REMOTE	\N	Creado automáticamente desde LinkedIn	2026-07-29 02:27:27.956	2026-07-29 02:27:27.956	2026-07-29 02:27:27.956
40624bd9-13f5-448e-bd86-50036f02dadb	Qodea	Backend Engineer - Python	https://www.linkedin.com/comm/jobs/view/4444970751/?trackingId=AoyOFFdiR8SLvYMaZot4wA%3D%3D&refId=GF5ERrT6QZK9tPH41lP5LA%3D%3D&lipi=urn%3Ali%3Apage%3Aemail_email_application_confirmation_with_nba_01%3BzO0bdjSwSiSErTiMv1sfWw%3D%3D&midToken=AQE4bm2SsPUZeA&midSig=0T3zke5Cfy1so1&trk=eml-email_application_confirmation_with_nba_01-application~confirmation-0-view_job&trkEmail=eml-email_application_confirmation_with_nba_01-application~confirmation-0-view_job-null-l16dt0~ms5g6es7~m8-null-null&eid=l16dt0-ms5g6es7-m8&otpToken=MjdlYzI4NzY5ZGIzNjVkY2YwM2EzZWNiMzJiYmU5ZjRiNWMyNzYwN2E0Nzc1YzM4YmY4MTEzYTRiYTQ0M2Q0N2ZiMTM2M2ViNDBlYjNmYTcyZDk3M2YzZDI2YzFhMDFhODI3ZTEwMGM0NGZmNzU3ZWRmZTcxMDg1YTA4YTkwNmIyZTgzMWMzMjIxMGQ5M2E0LDIsMQ%3D%3D	APPLIED	REMOTE	\N	Creado automáticamente desde LinkedIn	2026-07-29 08:51:44.578	2026-07-29 08:51:44.578	2026-07-29 08:51:44.578
\.


--
-- Data for Name: Notification; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."Notification" (id, "applicationId", type, payload, "sentAt", "createdAt") FROM stdin;
\.


--
-- Data for Name: StatusHistory; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public."StatusHistory" (id, "applicationId", "fromStatus", "toStatus", "changedAt", note) FROM stdin;
1f4a7c30-d8b8-41f8-85b0-1bca4225ca73	28dcf9d2-f832-47a8-ba64-d369b87feb20	\N	GHOSTED	2026-07-22 00:21:54.867	\N
ec464b83-2113-4243-b807-b143ad8306b0	28dcf9d2-f832-47a8-ba64-d369b87feb20	GHOSTED	ASSESSMENT	2026-07-22 00:22:19.379	\N
80fb4846-0123-4849-86b1-48cff2bd0553	9e4b2e06-1c0d-46a1-8166-c318991d320e	\N	APPLIED	2026-07-22 00:23:49.825	\N
8e49087e-5c53-4d45-a097-fb02adcd550d	36e2a006-5ed5-451d-a234-01abdcb75cf2	\N	APPLIED	2026-07-22 00:25:16.045	\N
94202713-abc0-4f02-9b89-bd84af784e81	ec22f22e-0de5-4456-a21c-fea881a5c1a6	\N	INTERVIEW	2026-07-22 00:26:40.971	\N
e733bf41-782e-4c2d-9e18-3d365ab1e7d6	2c1db220-7046-4937-8829-6c72a6877800	\N	OFFER	2026-07-22 00:28:21.544	\N
3ef4ca24-e435-40fb-a5d4-d7baa3ec4111	6dc6111b-1cbc-467f-9773-0f9dcbcf7355	\N	APPLIED	2026-07-22 00:30:45.079	\N
65be6c27-a54b-4217-a673-7c039dc71016	b4bb9a5a-fad6-4da9-bbfe-a13477029eaf	\N	APPLIED	2026-07-22 00:31:40.092	\N
3bcac671-3670-4124-ab52-4260efb0816a	57e5a902-5a6a-4bcc-b539-dd6a4623edcb	\N	APPLIED	2026-07-22 00:33:10.026	\N
1be4689b-2c9b-4239-972c-3e1f758414a7	9e4b2e06-1c0d-46a1-8166-c318991d320e	APPLIED	GHOSTED	2026-07-22 00:33:26.313	\N
215e5abb-9f9d-414f-948f-d204a4b47d27	36e2a006-5ed5-451d-a234-01abdcb75cf2	APPLIED	GHOSTED	2026-07-22 00:33:34.826	\N
f7db032f-4192-40db-a412-377c2e34f58e	77754ecd-d84b-4d96-aed8-a7f1fa5bfbe8	\N	APPLIED	2026-07-23 23:08:46.841	\N
f7de8e1c-2941-4d72-a43d-141f2f50b477	7512427a-b274-4a27-9ae0-0951ad6f924a	\N	APPLIED	2026-07-23 23:12:40.781	\N
f22652f4-ae50-41dc-82b0-b55a1aace2f1	39480f65-3889-4a6b-bb86-8ba98735efbd	\N	APPLIED	2026-07-23 23:15:25.94	\N
2f5f8a3f-dcdf-4d2c-9015-f9ef2cc89762	ee8f8592-7863-4646-acd1-e42e98c71e87	\N	APPLIED	2026-07-23 23:21:16.943	\N
724963ef-15d5-45d9-af30-bc79f59a0024	8bb91659-6f1c-4fc3-9eeb-027a969e7659	\N	APPLIED	2026-07-23 23:24:32.137	\N
031ad9bb-cf18-4aa8-9047-9adaae480052	710e6f4f-cdb7-4cac-bf76-112f06ad572b	\N	APPLIED	2026-07-23 23:26:08.819	\N
fa86ff06-96c4-4e0c-8bb9-f4963fd68888	3271083b-1351-470e-9bd2-bcdb78ac9daf	\N	APPLIED	2026-07-23 23:28:58.931	\N
660e5068-3644-4302-8b59-6163035350fe	768a6a1a-34c3-496c-9afb-e7017cf6d352	\N	APPLIED	2026-07-23 23:30:54.7	\N
0991418f-19c6-4025-bf5d-05d73f643b5a	e6237b8f-e555-4c4b-8630-3320e68a74c5	\N	APPLIED	2026-07-23 23:32:00.144	\N
6382f8ca-fae7-423f-943d-1fddd344de4b	7227ff31-8394-4636-a0ba-ca8e8fda1954	\N	APPLIED	2026-07-29 00:37:54.231	\N
4fce287f-3ca9-4f86-a863-f07c299e7f40	efe1d524-16dd-4725-9674-883b81492f61	\N	APPLIED	2026-07-29 00:52:49.033	\N
0c049896-0325-4b67-96d8-a7c9d53a68f7	5cff55c4-7258-4c5b-bfeb-d9f9898ba730	\N	APPLIED	2026-07-29 01:06:48.454	\N
c12c8551-605c-4a41-a262-00bb7a4a6bf4	70c1f88a-bd2d-40a4-950e-4cdc1d00c4a4	\N	APPLIED	2026-07-29 01:36:22.01	\N
d8195f5b-5bb5-4566-a596-22f638d2d263	983b1215-01a2-4651-9ee6-0a2ca58b7168	\N	APPLIED	2026-07-29 01:43:31.658	\N
3001764d-8219-4e78-9d30-fa41b324791d	5d3d8d18-4054-45a8-ac4b-9bbc1f491878	\N	APPLIED	2026-07-29 01:55:08.266	\N
55912520-d430-469d-91bf-70b7579afebc	7e8d37d1-467f-4f1d-beb4-6408b0ff9ea4	\N	APPLIED	2026-07-29 01:57:52.626	\N
0002efc9-6c86-4a45-bb2a-92f672f0415f	dc4a4b70-d2b1-429d-bdb6-474519435d6f	\N	APPLIED	2026-07-29 02:04:46.551	\N
e9525877-2cd8-4814-a643-e61bf0930aff	0193a0a6-3a32-4029-874e-1cd4a908e864	\N	APPLIED	2026-07-29 02:11:25.787	\N
c59109a2-208f-4faa-89a2-c7ee0f8dc75b	50b15030-7fd6-44ab-af3a-cd7441b612da	\N	APPLIED	2026-07-29 02:24:40.567	\N
e6110c12-a1c9-455d-92b3-6a98004befc1	1ec2014f-27d6-4bc0-9595-b3544b8a58f2	\N	APPLIED	2026-07-29 02:27:27.956	\N
9201a51d-ff74-488d-8653-32d1ac55d2d8	40624bd9-13f5-448e-bd86-50036f02dadb	\N	APPLIED	2026-07-29 08:51:44.578	\N
\.


--
-- Data for Name: _prisma_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public._prisma_migrations (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count) FROM stdin;
8c8dd254-a3f1-4878-9262-05c0c7ef630f	f8dd5a37eab46b9ab8f508f14f5c6ae2a96402b513b2fbb4d5ebee780736f9c0	2026-07-17 21:08:41.954037-03	20260718000841_init	\N	\N	2026-07-17 21:08:41.791826-03	1
\.


--
-- PostgreSQL database dump complete
--

\unrestrict bxKMwAbvgJFTrHQaMu3AHi1LTh2foLPQWrTH25ap4ux9WOBX5DSi21C6iQGHHwO

