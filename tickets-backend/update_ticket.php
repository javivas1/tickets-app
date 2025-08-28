<?php
header("Content-Type: application/json; charset=UTF-8");
require "db.php";

if($_SERVER['REQUEST_METHOD']!=='POST' && $_SERVER['REQUEST_METHOD']!=='PUT'){
  http_response_code(405); echo json_encode(["error"=>"Método no permitido"]); exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = (int)($data["id"] ?? 0);
$titulo = trim($data["titulo"] ?? "");
$descripcion = trim($data["descripcion"] ?? "");
$prioridad = $data["prioridad"] ?? "";

if($id<=0){ echo json_encode(["error"=>"ID inválido"]); exit; }
if(mb_strlen($titulo)<5){ echo json_encode(["error"=>"El título debe tener al menos 5 caracteres."]); exit; }
if(mb_strlen($descripcion)<10){ echo json_encode(["error"=>"La descripción debe tener al menos 10 caracteres."]); exit; }
$permitidas = ["baja","media","alta"];
if(!in_array($prioridad,$permitidas,true)){ echo json_encode(["error"=>"La prioridad debe ser baja | media | alta."]); exit; }

$stmt = $conn->prepare("UPDATE tickets SET titulo=?, descripcion=?, prioridad=? WHERE id=?");
$stmt->bind_param("sssi", $titulo, $descripcion, $prioridad, $id);
$ok = $stmt->execute();

echo $ok ? json_encode(["success"=>true]) : json_encode(["error"=>"No se pudo actualizar"]);
$stmt->close(); $conn->close();
