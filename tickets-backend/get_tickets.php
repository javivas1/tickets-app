<?php
header("Content-Type: application/json; charset=UTF-8");
require "db.php";

$sql = "SELECT id,titulo,descripcion,prioridad,estado,fecha_creacion
        FROM tickets
        ORDER BY fecha_creacion DESC, id DESC";
$res = $conn->query($sql);

if(!$res){ http_response_code(500); echo json_encode(["success"=>false,"error"=>"Error al listar"]); exit; }

$rows=[]; while($row=$res->fetch_assoc()) $rows[]=$row;
echo json_encode(["success"=>true,"data"=>$rows], JSON_UNESCAPED_UNICODE);
$res->free(); $conn->close();
