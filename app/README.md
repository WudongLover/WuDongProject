此模块用于实现服务模块,可以每个模块的后端分开;前端需要统一使用同一个模块
衣,食,住,行,社区,后台6个后端模块;
PC端,后台端2个前端模块;

衣,6666端口

食,6667端口

住,6668端口

行,6669端口

社区,6665端口

后台,6664

每个后端模块架构可以类似于这样

```
gen_img_v1_py/
├── __pycache__/
├── __init__.py
├── .env
├── .env.example
├── app.py
├── config.py
├── config.yml
├── open_ai.py
├── prompt_mapping.py
├── requirements.txt
├── schemas.py
├── service.py
├── storage.py
└── test_gen_img_v1.py

```

