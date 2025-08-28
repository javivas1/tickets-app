<?php
header("Content-Type: application/json; charset=UTF-8");
require "db.php";

if ($_SERVER['REQUEST_METHOD']!=='POST' && $_SERVER['REQUEST_METHOD']!=='PATCH') {
  http_response_code(405); echo json_encode(["error"=>"Método no permitido"]); exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$id = (int)($data["id"] ?? 0);
if ($id<=0) { echo json_encode(["error"=>"ID inválido"]); exit; }

// Leer estado actual
$stmt = $conn->prepare("SELECT estado FROM tickets WHERE id=?");
$stmt->bind_param("i", $id);
$stmt->execute();
$res = $stmt->get_result();
if ($res->num_rows===0) { echo json_encode(["error"=>"Ticket no encontrado"]); exit; }
$curr = $res->fetch_assoc()["estado"];
$stmt->close();

// Calcular siguiente estado válido
$next = null;
if ($curr === "abierto")        $next = "en_progreso";
elseif ($curr === "en_progreso") $next = "cerrado";
else { echo json_encode(["error"=>"Transición inválida desde '$curr'"]); exit; }

// Actualizar
$stmt = $conn->prepare("UPDATE tickets SET estado=? WHERE id=?");
$stmt->bind_param("si", $next, $id);
$ok = $stmt->execute();
$stmt->close(); $conn->close();

echo $ok ? json_encode(["success"=>true,"estado"=>$next]) : json_encode(["error"=>"No se pudo actualizar estado"]);